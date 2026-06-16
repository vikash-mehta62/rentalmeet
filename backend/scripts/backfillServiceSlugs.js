/**
 * One-time migration: backfill slugs for all VendorService documents
 * that don't have a slug yet.
 *
 * Run: node backend/scripts/backfillServiceSlugs.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const VendorService = require('../models/VendorService');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const services = await VendorService.find({ $or: [{ slug: null }, { slug: '' }, { slug: { $exists: false } }] });
  console.log(`Found ${services.length} services without a slug`);

  let updated = 0;
  for (const svc of services) {
    // Trigger the pre-save hook which auto-generates the slug
    svc.markModified('title');
    await svc.save();
    console.log(`  ✓ ${svc.title} (${svc.city}) → ${svc.slug}`);
    updated++;
  }

  console.log(`\n✅ Done — ${updated} services updated`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
