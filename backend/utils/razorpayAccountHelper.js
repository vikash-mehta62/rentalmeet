const DEFAULT_BUSINESS_MODEL = 'RentalMeet marketplace payout beneficiary for venue and service bookings';

const compact = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const sanitizeName = (value, fallback = 'RentalMeet Partner') => {
  const cleaned = compact(value).replace(/[^a-zA-Z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const name = cleaned || fallback;
  return name.length >= 4 ? name.slice(0, 200) : `${name} Partner`.slice(0, 200);
};

const normalizePhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length >= 8 && digits.length <= 15) return digits;
  if (digits.length > 15) return digits.slice(-15);
  return '';
};

const normalizeEmail = (value) => compact(value).toLowerCase();
const normalizeAccountNumber = (value) => String(value || '').replace(/\D/g, '');

const parseExistingAccountId = (error) => {
  const message = error?.error?.description || error?.description || error?.message || '';
  return message.match(/acc_[A-Za-z0-9]+/)?.[0] || null;
};

const getSavedLinkedAccountId = (bankDetails, beneficiaryUser) => {
  return bankDetails?.razorpayAccountId ||
    bankDetails?.linkedAccountId ||
    beneficiaryUser?.razorpayAccountId ||
    beneficiaryUser?.linkedAccountId ||
    null;
};

const getVenuePayloadSource = (venue, beneficiaryUser, bankDetails) => ({
  businessName: venue?.businessName || beneficiaryUser?.companyName || bankDetails?.accountHolderName,
  displayName: venue?.businessName || bankDetails?.accountHolderName,
  contactName: venue?.ownerInfo?.fullName || beneficiaryUser?.name || bankDetails?.accountHolderName,
  email: venue?.ownerInfo?.email || beneficiaryUser?.email,
  phone: venue?.ownerInfo?.mobile || venue?.ownerInfo?.alternatePhone || beneficiaryUser?.phone,
  gst: venue?.ownerInfo?.gstNumber || beneficiaryUser?.gstNumber,
  pan: venue?.documents?.idProof?.type === 'PAN' ? venue?.documents?.idProof?.number : beneficiaryUser?.panNumber,
  city: venue?.location?.city,
  state: venue?.location?.state,
  postalCode: venue?.location?.pincode,
  address: [venue?.location?.address, venue?.location?.area].filter(Boolean).join(', '),
  sourceType: 'venue',
  sourceId: venue?._id
});

const getServicePayloadSource = (vendorProfile, beneficiaryUser, bankDetails) => ({
  businessName: vendorProfile?.businessInfo?.companyName || vendorProfile?.businessInfo?.brandName || beneficiaryUser?.companyName || bankDetails?.accountHolderName,
  displayName: vendorProfile?.businessInfo?.brandName || vendorProfile?.businessInfo?.companyName || bankDetails?.accountHolderName,
  contactName: vendorProfile?.basicInfo?.fullName || beneficiaryUser?.name || bankDetails?.accountHolderName,
  email: vendorProfile?.basicInfo?.email || beneficiaryUser?.email,
  phone: vendorProfile?.basicInfo?.phone || vendorProfile?.basicInfo?.mobile || beneficiaryUser?.phone,
  gst: vendorProfile?.businessDocs?.gst || beneficiaryUser?.gstNumber,
  pan: vendorProfile?.businessDocs?.pan || vendorProfile?.ownerDocs?.pan || beneficiaryUser?.panNumber,
  city: vendorProfile?.address?.city,
  state: vendorProfile?.address?.state,
  postalCode: vendorProfile?.address?.pincode,
  address: [vendorProfile?.address?.officeAddress, vendorProfile?.address?.area, vendorProfile?.address?.village].filter(Boolean).join(', '),
  sourceType: 'service',
  sourceId: vendorProfile?._id
});

const buildProfile = (source) => {
  const profile = {
    business_model: process.env.RAZORPAY_ROUTE_BUSINESS_MODEL || DEFAULT_BUSINESS_MODEL
  };

  if (process.env.RAZORPAY_ROUTE_CATEGORY) profile.category = process.env.RAZORPAY_ROUTE_CATEGORY;
  if (process.env.RAZORPAY_ROUTE_SUBCATEGORY) profile.subcategory = process.env.RAZORPAY_ROUTE_SUBCATEGORY;

  const street = compact(source.address);
  const city = compact(source.city);
  const state = compact(source.state);
  const postalCode = String(source.postalCode || '').replace(/\D/g, '');

  if (street && city && state && postalCode.length === 6) {
    profile.addresses = {
      registered: {
        street1: street.slice(0, 100),
        street2: '',
        city: city.slice(0, 100),
        state: state.slice(0, 32).toUpperCase(),
        postal_code: postalCode,
        country: 'IN'
      }
    };
  }

  return profile;
};

const inferBusinessType = (beneficiaryUser) => {
  if (process.env.RAZORPAY_ROUTE_BUSINESS_TYPE) return process.env.RAZORPAY_ROUTE_BUSINESS_TYPE;
  return beneficiaryUser?.accountType === 'company' ? 'private_limited' : 'individual';
};

const buildLinkedAccountPayload = ({ bookingType, beneficiaryUser, venue, vendorProfile, bankDetails }) => {
  const source = bookingType === 'venue'
    ? getVenuePayloadSource(venue, beneficiaryUser, bankDetails)
    : getServicePayloadSource(vendorProfile, beneficiaryUser, bankDetails);

  const email = normalizeEmail(source.email);
  const phone = normalizePhone(source.phone);

  if (!email) throw new Error('Beneficiary email is required to create Razorpay linked account.');
  if (!phone) throw new Error('Beneficiary phone is required to create Razorpay linked account.');

  const legalBusinessName = sanitizeName(source.businessName || source.contactName || bankDetails?.accountHolderName);
  const contactName = sanitizeName(source.contactName || legalBusinessName);
  const legalInfo = {};
  const pan = compact(source.pan).toUpperCase();
  const gst = compact(source.gst).toUpperCase();
  if (pan) legalInfo.pan = pan;
  if (gst) legalInfo.gst = gst;

  const payload = {
    email,
    phone,
    type: 'route',
    legal_business_name: legalBusinessName,
    customer_facing_business_name: sanitizeName(source.displayName || legalBusinessName),
    business_type: inferBusinessType(beneficiaryUser),
    contact_name: contactName,
    profile: buildProfile(source),
    notes: {
      rentalmeet_source: source.sourceType,
      rentalmeet_source_id: source.sourceId ? String(source.sourceId) : '',
      rentalmeet_user_id: beneficiaryUser?._id ? String(beneficiaryUser._id) : ''
    }
  };

  if (Object.keys(legalInfo).length > 0) payload.legal_info = legalInfo;
  return payload;
};

const buildSettlementConfig = (bankDetails) => {
  const accountNumber = normalizeAccountNumber(bankDetails?.accountNumber || bankDetails?.accountNumberCard);
  const ifscCode = compact(bankDetails?.ifscCode || bankDetails?.ifsc).toUpperCase();
  const beneficiaryName = sanitizeName(bankDetails?.accountHolderName, 'RentalMeet Partner');

  if (!accountNumber || !ifscCode || !beneficiaryName) return null;

  return {
    beneficiary_name: beneficiaryName,
    account_number: accountNumber,
    ifsc_code: ifscCode
  };
};

const configureSettlementBankDetails = async ({ razorpay, accountId, bankDetails }) => {
  const settlements = buildSettlementConfig(bankDetails);
  if (!settlements || !razorpay?.products?.requestProductConfiguration) return null;

  const productName = process.env.RAZORPAY_LINKED_ACCOUNT_PRODUCT || process.env.RAZORPAY_ROUTE_PRODUCT || 'route';
  const productPayload = {
    product_name: productName,
    tnc_accepted: process.env.RAZORPAY_LINKED_ACCOUNT_TNC_ACCEPTED === 'false' ? false : true
  };

  if (process.env.RAZORPAY_LINKED_ACCOUNT_TNC_IP) {
    productPayload.ip = process.env.RAZORPAY_LINKED_ACCOUNT_TNC_IP;
  }

  const product = await razorpay.products.requestProductConfiguration(accountId, productPayload);
  const productId = product?.id;

  if (productId && razorpay.products?.edit) {
    await razorpay.products.edit(accountId, productId, { settlements, tnc_accepted: true });
  }

  return product;
};

const persistLinkedAccountId = async ({ accountId, accountStatus, venue, vendorProfile, beneficiaryUser }) => {
  const syncedAt = new Date();
  const createdAt = syncedAt;

  const assignBankDetails = (doc) => {
    if (!doc?.bankDetails) return false;
    doc.bankDetails.razorpayAccountId = accountId;
    doc.bankDetails.linkedAccountId = accountId;
    doc.bankDetails.razorpayAccountStatus = accountStatus || doc.bankDetails.razorpayAccountStatus || 'created';
    doc.bankDetails.razorpayAccountCreatedAt = doc.bankDetails.razorpayAccountCreatedAt || createdAt;
    doc.bankDetails.razorpayAccountSyncedAt = syncedAt;
    doc.markModified?.('bankDetails');
    return true;
  };

  const saves = [];
  if (assignBankDetails(venue)) saves.push(venue.save({ validateBeforeSave: false }));
  if (assignBankDetails(vendorProfile)) saves.push(vendorProfile.save({ validateBeforeSave: false }));

  if (beneficiaryUser) {
    beneficiaryUser.razorpayAccountId = beneficiaryUser.razorpayAccountId || accountId;
    beneficiaryUser.linkedAccountId = beneficiaryUser.linkedAccountId || accountId;
    beneficiaryUser.razorpayAccountStatus = accountStatus || beneficiaryUser.razorpayAccountStatus || 'created';
    beneficiaryUser.razorpayAccountSyncedAt = syncedAt;
    saves.push(beneficiaryUser.save({ validateBeforeSave: false }));
  }

  await Promise.all(saves);
};

const ensureRazorpayLinkedAccount = async ({ razorpay, bookingType, beneficiaryUser, venue, vendorProfile, bankDetails, settlementBankDetails }) => {
  const savedAccountId = getSavedLinkedAccountId(bankDetails, beneficiaryUser);
  if (savedAccountId) {
    try {
      await configureSettlementBankDetails({
        razorpay,
        accountId: savedAccountId,
        bankDetails: settlementBankDetails || bankDetails
      });
    } catch (configErr) {
      console.warn('[RAZORPAY_ACCOUNT] Settlement bank configuration skipped for ' + savedAccountId + ':', configErr.error?.description || configErr.message);
    }

    return savedAccountId;
  }

  const payload = buildLinkedAccountPayload({ bookingType, beneficiaryUser, venue, vendorProfile, bankDetails });

  try {
    const account = await razorpay.accounts.create(payload);
    if (!account?.id) throw new Error('Razorpay did not return a linked account ID.');

    await persistLinkedAccountId({
      accountId: account.id,
      accountStatus: account.status,
      venue,
      vendorProfile,
      beneficiaryUser
    });

    try {
      await configureSettlementBankDetails({
        razorpay,
        accountId: account.id,
        bankDetails: settlementBankDetails || bankDetails
      });
    } catch (configErr) {
      console.warn('[RAZORPAY_ACCOUNT] Settlement bank configuration skipped for ' + account.id + ':', configErr.error?.description || configErr.message);
    }

    return account.id;
  } catch (error) {
    const existingAccountId = parseExistingAccountId(error);
    if (existingAccountId) {
      await persistLinkedAccountId({
        accountId: existingAccountId,
        accountStatus: 'created',
        venue,
        vendorProfile,
        beneficiaryUser
      });

      try {
        await configureSettlementBankDetails({
          razorpay,
          accountId: existingAccountId,
          bankDetails: settlementBankDetails || bankDetails
        });
      } catch (configErr) {
      console.warn('[RAZORPAY_ACCOUNT] Settlement bank configuration skipped for ' + existingAccountId + ':', configErr.error?.description || configErr.message);
      }

      return existingAccountId;
    }

    throw error;
  }
};

module.exports = {
  ensureRazorpayLinkedAccount
};
