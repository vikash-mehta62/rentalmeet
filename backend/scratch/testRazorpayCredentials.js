require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const Razorpay = require('razorpay');

async function testRazorpayCredentials() {
  console.log('\n🔍 Testing Razorpay Credentials...\n');
  
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  console.log('Key ID:', keyId);
  console.log('Key Secret:', keySecret ? `${keySecret.substring(0, 4)}...${keySecret.substring(keySecret.length - 4)}` : 'NOT FOUND');
  console.log('Environment:', keyId?.includes('test') ? '🧪 TEST MODE' : '🚀 LIVE MODE');
  console.log('\n' + '='.repeat(50) + '\n');

  if (!keyId || !keySecret) {
    console.error('❌ Razorpay credentials not found in .env file');
    process.exit(1);
  }

  try {
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    console.log('Test 1: Creating a test order...');
    const order = await razorpay.orders.create({
      amount: 50000, // ₹500 in paise
      currency: 'INR',
      receipt: `test_receipt_${Date.now()}`,
      notes: {
        test: true,
        purpose: 'Credential validation'
      }
    });

    console.log('✅ Order created successfully!');
    console.log('   Order ID:', order.id);
    console.log('   Amount:', order.amount / 100, 'INR');
    console.log('   Status:', order.status);
    console.log('   Created at:', new Date(order.created_at * 1000).toLocaleString());

    console.log('\nTest 2: Fetching order details...');
    const fetchedOrder = await razorpay.orders.fetch(order.id);
    console.log('✅ Order fetched successfully!');
    console.log('   Order ID:', fetchedOrder.id);
    console.log('   Receipt:', fetchedOrder.receipt);

    console.log('\n' + '='.repeat(50));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(50));
    console.log('\n✨ Razorpay credentials are VALID and working correctly!\n');

  } catch (error) {
    console.log('\n' + '='.repeat(50));
    console.log('❌ AUTHENTICATION FAILED!');
    console.log('='.repeat(50));
    
    if (error.statusCode === 401) {
      console.error('\n🚫 Error: Invalid API credentials');
      console.error('\nPossible reasons:');
      console.error('  1. Key ID and Secret do not match');
      console.error('  2. Keys are from different Razorpay accounts');
      console.error('  3. Keys have been regenerated/revoked');
      console.error('  4. Test/Live mode mismatch');
      console.error('\n💡 Solution:');
      console.error('  → Go to Razorpay Dashboard');
      console.error('  → Settings > API Keys');
      console.error('  → Regenerate Test Mode keys');
      console.error('  → Update .env file with new credentials');
    } else if (error.statusCode === 400) {
      console.error('\n⚠️  Bad Request:', error.error?.description || error.message);
    } else {
      console.error('\n⚠️  Error:', error.message);
      if (error.error) {
        console.error('  Details:', JSON.stringify(error.error, null, 2));
      }
    }
    
    console.log('\n');
    process.exit(1);
  }
}

testRazorpayCredentials();
