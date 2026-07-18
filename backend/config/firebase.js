const fs = require('fs');
const path = require('path');
const { initializeApp, getApp, getApps, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

let firebaseApp = null;
let messaging = null;
let initialized = false;
let initError = null;

const loadServiceAccount = () => {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : path.join(__dirname, 'firebase-service-account.json');

  const raw = fs.readFileSync(serviceAccountPath, 'utf8');
  const serviceAccount = JSON.parse(raw);

  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  return { serviceAccount, serviceAccountPath };
};

try {
  if (getApps().length > 0) {
    firebaseApp = getApp();
  } else {
    const { serviceAccount, serviceAccountPath } = loadServiceAccount();
    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    console.log(`[FIREBASE] Service account loaded from ${serviceAccountPath}`);
  }

  messaging = getMessaging(firebaseApp);
  initialized = true;
  console.log('[FIREBASE] Firebase Admin initialized successfully.');
} catch (error) {
  initError = error.message;
  console.error('[FIREBASE] Firebase Admin initialization error:', initError);
}

const normalizeData = (data = {}) => Object.fromEntries(
  Object.entries(data)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => [key, typeof value === 'object' ? JSON.stringify(value) : String(value)])
);

const chunk = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const getNotReadyResult = (tokens) => {
  const cleanTokens = [...new Set((tokens || []).filter(Boolean))];
  if (cleanTokens.length === 0) {
    return { success: false, reason: 'No FCM tokens provided', successCount: 0, failureCount: 0 };
  }
  if (!initialized || !messaging) {
    return {
      success: false,
      reason: `Firebase not initialized${initError ? `: ${initError}` : ''}`,
      successCount: 0,
      failureCount: cleanTokens.length
    };
  }
  return null;
};

const sendToTokens = async (tokens, payload) => {
  const notReady = getNotReadyResult(tokens);
  if (notReady) return notReady;

  const uniqueTokens = [...new Set(tokens.filter(Boolean))];
  const batches = chunk(uniqueTokens, 500);

  try {
    const batchResponses = [];
    let successCount = 0;
    let failureCount = 0;

    for (const tokenBatch of batches) {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl })
        },
        data: normalizeData(payload.data),
        tokens: tokenBatch
      };

      const response = await messaging.sendEachForMulticast(message);
      successCount += response.successCount;
      failureCount += response.failureCount;
      batchResponses.push(...response.responses);
    }

    console.log(`[FIREBASE] Push sent to ${successCount} devices. Failures: ${failureCount}`);

    if (failureCount > 0) {
      batchResponses.forEach((resp, idx) => {
        if (!resp.success) {
          console.warn(`[FIREBASE] Failed token index ${idx}:`, resp.error?.message);
        }
      });
    }

    return {
      success: successCount > 0,
      successCount,
      failureCount,
      responses: batchResponses
    };
  } catch (error) {
    console.error('[FIREBASE] Error sending multicast push:', error.message);
    return { success: false, error: error.message };
  }
};

const subscribeToTopic = async (tokens, topicSlug) => {
  const notReady = getNotReadyResult(tokens);
  if (notReady) return notReady;

  const cleanTokens = [...new Set(tokens.filter(Boolean))];

  try {
    const response = await messaging.subscribeToTopic(cleanTokens, topicSlug);
    console.log(`[FIREBASE] Subscribed ${cleanTokens.length} tokens to topic: ${topicSlug}. Errors:`, response.errors?.length || 0);
    return { success: true, response };
  } catch (error) {
    console.error(`[FIREBASE] Error subscribing to topic ${topicSlug}:`, error.message);
    return { success: false, error: error.message };
  }
};

const unsubscribeFromTopic = async (tokens, topicSlug) => {
  const notReady = getNotReadyResult(tokens);
  if (notReady) return notReady;

  const cleanTokens = [...new Set(tokens.filter(Boolean))];

  try {
    const response = await messaging.unsubscribeFromTopic(cleanTokens, topicSlug);
    console.log(`[FIREBASE] Unsubscribed ${cleanTokens.length} tokens from topic: ${topicSlug}. Errors:`, response.errors?.length || 0);
    return { success: true, response };
  } catch (error) {
    console.error(`[FIREBASE] Error unsubscribing from topic ${topicSlug}:`, error.message);
    return { success: false, error: error.message };
  }
};

const sendToTopic = async (topicSlug, payload) => {
  if (!initialized || !messaging) {
    return { success: false, reason: `Firebase not initialized${initError ? `: ${initError}` : ''}` };
  }

  const message = {
    notification: {
      title: payload.title,
      body: payload.body,
      ...(payload.imageUrl && { imageUrl: payload.imageUrl })
    },
    data: normalizeData(payload.data),
    topic: topicSlug
  };

  try {
    const response = await messaging.send(message);
    console.log(`[FIREBASE] Push sent to topic ${topicSlug}. Message ID: ${response}`);
    return { success: true, messageId: response };
  } catch (error) {
    console.error(`[FIREBASE] Error sending to topic ${topicSlug}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  initialized,
  initError,
  sendToTokens,
  subscribeToTopic,
  unsubscribeFromTopic,
  sendToTopic
};