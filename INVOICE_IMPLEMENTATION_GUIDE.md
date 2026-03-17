# Invoice Implementation Guide - VenueHub

## 📋 Complete Implementation Checklist

### ✅ Completed
1. Frontend Platform Settings page with 2 sections
2. Backend PlatformSettings model updated
3. Booking model updated with invoice fields
4. Helper methods for invoice calculation

### 🔄 Pending Implementation
1. Update Booking Controller
2. Create Invoice PDF Templates
3. Email Service for invoices
4. Customer Dashboard invoice download

---

## 🎯 How to Use in Booking Controller

### Step 1: Fetch Platform Settings

```javascript
const PlatformSettings = require('../models/PlatformSettings');

// In booking controller
const settings = await PlatformSettings.getSettings();
```

### Step 2: Calculate Invoices

```javascript
// Create booking
const booking = new Booking({
  bookingNumber: generatedBookingNumber,
  venue: venueId,
  customer: customerId,
  bookingDate: date,
  // ... other fields
});

// Calculate GST invoices
const invoiceData = booking.calculateGSTInvoices(settings);

// Generate invoice numbers
booking.generateInvoiceNumbers();

// Save booking
await booking.save();
```

### Step 3: Response to Frontend

```javascript
res.json({
  success: true,
  booking: booking,
  invoices: {
    venue: booking.venueInvoice,
    platform: booking.platformInvoice,
    customerPays: booking.amount
  }
});
```

---

## 📊 Example Booking Flow

### Input Data
```javascript
{
  venueId: "venue123",
  customerId: "customer456",
  bookingDate: "2025-03-15",
  baseAmount: 10000,
  amenitiesTotal: 2000
}
```

### Platform Settings
```javascript
{
  venueCGST: 9,
  venueSGST: 9,
  venueHSN: "9973",
  platformFeePercentage: 5,
  platformCGST: 9,
  platformSGST: 9
}
```

### Calculation Process

#### Step 1: Calculate Venue Invoice
```javascript
Base Amount: ₹12,000 (10000 + 2000)
Venue CGST (9%): ₹1,080
Venue SGST (9%): ₹1,080
Venue Total: ₹14,160
```

#### Step 2: Calculate Platform Invoice
```javascript
Platform Fee (5% of ₹12,000): ₹600
Platform CGST (9% of ₹600): ₹54
Platform SGST (9% of ₹600): ₹54
Platform Total: ₹708
```

#### Step 3: Final Amount
```javascript
Customer Pays: ₹14,868 (₹14,160 + ₹708)
```

### Saved Booking Document
```javascript
{
  bookingNumber: "BK-20250315-001",
  amount: 14868,
  
  priceBreakdown: {
    basePrice: 10000,
    amenitiesTotal: 2000,
    subtotal: 12000,
    total: 14868
  },
  
  venueInvoice: {
    invoiceNumber: "VEN-BK-20250315-001",
    amount: 12000,
    cgstRate: 9,
    cgst: 1080,
    sgstRate: 9,
    sgst: 1080,
    total: 14160,
    hsnCode: "9973"
  },
  
  platformInvoice: {
    invoiceNumber: "PLT-BK-20250315-001",
    platformFeeRate: 5,
    platformFee: 600,
    cgstRate: 9,
    cgst: 54,
    sgstRate: 9,
    sgst: 54,
    total: 708,
    hsnCode: "999799"
  },
  
  gstSettingsSnapshot: {
    venueCGST: 9,
    venueSGST: 9,
    venueHSN: "9973",
    platformFeePercentage: 5,
    platformCGST: 9,
    platformSGST: 9
  }
}
```

---

## 🔧 Booking Controller Update Example

```javascript
// backend/controllers/bookingController.js

const createBooking = async (req, res) => {
  try {
    const { venueId, bookingDate, customerDetails, selectedAmenities } = req.body;
    
    // 1. Fetch venue and calculate base amount
    const venue = await Venue.findById(venueId);
    const baseAmount = calculateBaseAmount(venue, bookingDate);
    const amenitiesTotal = calculateAmenitiesTotal(selectedAmenities);
    const subtotal = baseAmount + amenitiesTotal;
    
    // 2. Fetch platform settings
    const settings = await PlatformSettings.getSettings();
    
    // 3. Generate booking number
    const bookingNumber = await generateBookingNumber();
    
    // 4. Create booking
    const booking = new Booking({
      bookingNumber,
      venue: venueId,
      customer: req.user._id,
      bookingDate,
      customerDetails,
      selectedAmenities,
      priceBreakdown: {
        basePrice: baseAmount,
        amenitiesTotal,
        subtotal
      }
    });
    
    // 5. Calculate GST invoices
    const invoiceData = booking.calculateGSTInvoices(settings);
    
    // 6. Generate invoice numbers
    booking.generateInvoiceNumbers();
    
    // 7. Save booking
    await booking.save();
    
    // 8. Send response
    res.json({
      success: true,
      message: 'Booking created successfully',
      booking,
      invoices: {
        venue: booking.venueInvoice,
        platform: booking.platformInvoice,
        customerPays: booking.amount
      }
    });
    
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking'
    });
  }
};
```

---

## 📧 Email Template Structure

### Email to Customer

```
Subject: Booking Confirmation - [Venue Name] - [Booking Number]

Dear [Customer Name],

Your booking has been confirmed!

Booking Details:
- Venue: [Venue Name]
- Date: [Booking Date]
- Time: [Start Time] - [End Time]
- Guests: [Guest Count]

Payment Summary:
- Venue Charges: ₹[Venue Total]
- Platform Fee: ₹[Platform Total]
- Total Paid: ₹[Customer Pays]

Attached Documents:
1. Venue Invoice (VEN-[Booking Number])
2. Platform Invoice (PLT-[Booking Number])

Thank you for choosing VenueHub!
```

---

## 📄 PDF Invoice Template Requirements

### Venue Invoice PDF
- Header: Venue details, GSTIN, address
- Customer details
- Service description with HSN code
- Table with CGST/SGST breakdown
- Total amount in words
- Footer with payment details

### Platform Invoice PDF
- Header: VenueHub details, GSTIN, address
- Customer details
- Platform fee description with HSN code
- Table with CGST/SGST breakdown
- Total amount in words
- Footer with payment details

---

## 🎨 Frontend Display

### Booking Confirmation Page
```jsx
<div className="invoice-summary">
  <h2>Payment Breakdown</h2>
  
  <div className="venue-invoice">
    <h3>Venue Charges</h3>
    <p>Base Amount: ₹{venueInvoice.amount}</p>
    <p>CGST ({venueInvoice.cgstRate}%): ₹{venueInvoice.cgst}</p>
    <p>SGST ({venueInvoice.sgstRate}%): ₹{venueInvoice.sgst}</p>
    <p><strong>Subtotal: ₹{venueInvoice.total}</strong></p>
  </div>
  
  <div className="platform-invoice">
    <h3>Platform Fee</h3>
    <p>Platform Fee ({platformInvoice.platformFeeRate}%): ₹{platformInvoice.platformFee}</p>
    <p>CGST ({platformInvoice.cgstRate}%): ₹{platformInvoice.cgst}</p>
    <p>SGST ({platformInvoice.sgstRate}%): ₹{platformInvoice.sgst}</p>
    <p><strong>Subtotal: ₹{platformInvoice.total}</strong></p>
  </div>
  
  <div className="total">
    <h2>Total Amount: ₹{customerPays}</h2>
  </div>
  
  <div className="invoice-downloads">
    <button>Download Venue Invoice</button>
    <button>Download Platform Invoice</button>
  </div>
</div>
```

---

## 🔐 Security Considerations

1. **GST Settings Snapshot**: Always save GST settings at booking time
2. **Invoice Numbers**: Generate unique invoice numbers
3. **Audit Trail**: Log all invoice generations
4. **Data Integrity**: Validate calculations before saving
5. **Access Control**: Only authorized users can view invoices

---

## 📈 Reporting & Analytics

### Revenue Reports
```javascript
// Venue Revenue
const venueRevenue = bookings.reduce((sum, b) => sum + b.venueInvoice.amount, 0);

// Platform Revenue
const platformRevenue = bookings.reduce((sum, b) => sum + b.platformInvoice.platformFee, 0);

// Total GST Collected
const totalGST = bookings.reduce((sum, b) => 
  sum + b.venueInvoice.cgst + b.venueInvoice.sgst + 
  b.platformInvoice.cgst + b.platformInvoice.sgst, 0
);
```

---

## ✅ Testing Checklist

- [ ] Platform settings update working
- [ ] Booking creation with GST calculation
- [ ] Invoice numbers generation
- [ ] GST settings snapshot saved
- [ ] Correct calculations for different rates
- [ ] PDF invoice generation
- [ ] Email sending with attachments
- [ ] Customer dashboard invoice download
- [ ] Admin reports showing correct revenue
- [ ] Edge cases (0% GST, 100% platform fee, etc.)

---

## 🚀 Deployment Steps

1. Update database schema (run migration if needed)
2. Update platform settings in production
3. Test with sample bookings
4. Verify invoice generation
5. Check email delivery
6. Monitor for errors
7. Update documentation

---

## 📞 Support

For any issues or questions:
- Check logs for errors
- Verify GST settings are correct
- Ensure booking calculations are accurate
- Contact development team if needed
