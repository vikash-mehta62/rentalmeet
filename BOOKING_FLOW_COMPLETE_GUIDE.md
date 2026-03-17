# Complete Booking Flow - Step by Step

## 🎯 Jab Customer Booking Karega Tab Kya Hoga

---

## Step 1: Customer Venue Select Karta Hai

```
Customer → Venue Page → "Book Now" Button Click
```

**Input Data:**
- Venue ID: `venue123`
- Booking Date: `2025-03-15`
- Start Time: `10:00 AM`
- End Time: `6:00 PM`
- Booking Type: `fullday`
- Guest Count: `100`
- Event Type: `Wedding`

---

## Step 2: Customer Amenities Select Karta Hai

```javascript
Selected Amenities = {
  basic: [
    { name: "Projector", rate: 1000, quantity: 1, total: 1000 },
    { name: "Sound System", rate: 2000, quantity: 1, total: 2000 }
  ],
  beverages: [
    { name: "Tea/Coffee", ratePerUnit: 20, quantity: 100, total: 2000 }
  ],
  lunchThalis: [
    { thaliType: "Veg Thali", ratePerPlate: 150, quantity: 100, total: 15000 }
  ]
}

Base Venue Price: ₹10,000
Amenities Total: ₹20,000 (1000 + 2000 + 2000 + 15000)
Subtotal: ₹30,000
```

---

## Step 3: Frontend Calculation (Before API Call)

```javascript
// Frontend calculates preview
const baseAmount = 10000;
const amenitiesTotal = 20000;
const subtotal = baseAmount + amenitiesTotal; // ₹30,000

// Note: GST calculation will happen on backend
// Frontend just shows "Calculating..." or uses platform settings for preview
```

---

## Step 4: Customer Fills Details & Clicks "Proceed to Payment"

```javascript
Customer Details = {
  name: "Rahul Sharma",
  email: "rahul@email.com",
  phone: "9876543210",
  eventType: "Wedding",
  guestCount: 100,
  specialRequirements: "Need parking for 50 cars"
}
```

---

## Step 5: API Call to Backend

```javascript
POST /api/bookings

Request Body:
{
  venue: "venue123",
  bookingDate: "2025-03-15",
  startTime: "10:00 AM",
  endTime: "6:00 PM",
  bookingType: "fullday",
  selectedAmenities: {
    basic: [...],
    beverages: [...],
    lunchThalis: [...]
  },
  amenitiesTotal: 20000,
  priceBreakdown: {
    basePrice: 10000,
    amenitiesTotal: 20000,
    subtotal: 30000
  },
  customerDetails: {
    name: "Rahul Sharma",
    email: "rahul@email.com",
    phone: "9876543210",
    eventType: "Wedding",
    guestCount: 100
  }
}
```

---

## Step 6: Backend Processing (bookingController.js)

### 6.1 Fetch Venue Details
```javascript
const venue = await Venue.findById("venue123");
// Returns: { businessName: "Grand Banquet Hall", location: {...}, ... }
```

### 6.2 Generate Booking Number
```javascript
const bookingNumber = await generateBookingNumber(venue);
// Returns: "MPBPL26MH000001"
// Format: STATE(2) + CITY(3) + YEAR(2) + VENUETYPE(2) + SERIAL(6)
```

### 6.3 Fetch Platform GST Settings
```javascript
const gstSettings = await PlatformSettings.getSettings();

// Returns:
{
  venueCGST: 9,
  venueSGST: 9,
  venueHSN: "9973",
  platformFeePercentage: 5,
  platformCGST: 9,
  platformSGST: 9
}
```

### 6.4 Create Booking Object
```javascript
const booking = new Booking({
  bookingNumber: "MPBPL26MH000001",
  venue: "venue123",
  customer: "customer456",
  bookingDate: "2025-03-15",
  startTime: "10:00 AM",
  endTime: "6:00 PM",
  bookingType: "fullday",
  selectedAmenities: {...},
  amenitiesTotal: 20000,
  priceBreakdown: {
    basePrice: 10000,
    amenitiesTotal: 20000,
    subtotal: 30000
  },
  customerDetails: {...}
});
```

### 6.5 Calculate GST Invoices
```javascript
// Call helper method
const invoiceData = booking.calculateGSTInvoices(gstSettings);

// Calculation Process:
// ==================

// VENUE INVOICE (Invoice 1)
const venueAmount = 30000; // Base + Amenities
const venueCGST = (30000 * 9) / 100 = 2700;
const venueSGST = (30000 * 9) / 100 = 2700;
const venueTotal = 30000 + 2700 + 2700 = 35400;

// PLATFORM INVOICE (Invoice 2)
const platformFee = (30000 * 5) / 100 = 1500;
const platformCGST = (1500 * 9) / 100 = 135;
const platformSGST = (1500 * 9) / 100 = 135;
const platformTotal = 1500 + 135 + 135 = 1770;

// TOTAL
const customerPays = 35400 + 1770 = 37170;

// Returns:
{
  venueInvoice: {
    invoiceNumber: "VEN-MPBPL26MH000001",
    amount: 30000,
    cgstRate: 9,
    cgst: 2700,
    sgstRate: 9,
    sgst: 2700,
    total: 35400,
    hsnCode: "9973"
  },
  platformInvoice: {
    invoiceNumber: "PLT-MPBPL26MH000001",
    platformFeeRate: 5,
    platformFee: 1500,
    cgstRate: 9,
    cgst: 135,
    sgstRate: 9,
    sgst: 135,
    total: 1770,
    hsnCode: "999799"
  },
  customerPays: 37170
}
```

### 6.6 Generate Invoice Numbers
```javascript
booking.generateInvoiceNumbers();
// Sets:
// venueInvoice.invoiceNumber = "VEN-MPBPL26MH000001"
// platformInvoice.invoiceNumber = "PLT-MPBPL26MH000001"
```

### 6.7 Save GST Settings Snapshot
```javascript
booking.gstSettingsSnapshot = {
  venueCGST: 9,
  venueSGST: 9,
  venueHSN: "9973",
  platformFeePercentage: 5,
  platformCGST: 9,
  platformSGST: 9
};
```

### 6.8 Set Owner Earnings
```javascript
booking.ownerEarnings = 30000; // Base amount only (no GST, no platform fee)
```

### 6.9 Save Booking
```javascript
await booking.save();
```

---

## Step 7: Backend Response

```javascript
Response:
{
  success: true,
  message: "Booking created successfully",
  booking: {
    _id: "booking789",
    bookingNumber: "MPBPL26MH000001",
    venue: {
      businessName: "Grand Banquet Hall",
      location: {...},
      sku: "MPBPL26MH001",
      images: [...]
    },
    customer: {
      name: "Rahul Sharma",
      email: "rahul@email.com",
      phone: "9876543210"
    },
    bookingDate: "2025-03-15",
    startTime: "10:00 AM",
    endTime: "6:00 PM",
    amount: 37170,
    status: "pending",
    paymentStatus: "pending",
    
    // Venue Invoice Data
    venueInvoice: {
      invoiceNumber: "VEN-MPBPL26MH000001",
      amount: 30000,
      cgstRate: 9,
      cgst: 2700,
      sgstRate: 9,
      sgst: 2700,
      total: 35400,
      hsnCode: "9973"
    },
    
    // Platform Invoice Data
    platformInvoice: {
      invoiceNumber: "PLT-MPBPL26MH000001",
      platformFeeRate: 5,
      platformFee: 1500,
      cgstRate: 9,
      cgst: 135,
      sgstRate: 9,
      sgst: 135,
      total: 1770,
      hsnCode: "999799"
    },
    
    // GST Settings Snapshot
    gstSettingsSnapshot: {
      venueCGST: 9,
      venueSGST: 9,
      venueHSN: "9973",
      platformFeePercentage: 5,
      platformCGST: 9,
      platformSGST: 9
    },
    
    ownerEarnings: 30000,
    createdAt: "2025-03-15T10:30:00.000Z"
  },
  
  // Invoice Summary
  invoices: {
    venue: {
      invoiceNumber: "VEN-MPBPL26MH000001",
      amount: 30000,
      cgst: 2700,
      sgst: 2700,
      total: 35400
    },
    platform: {
      invoiceNumber: "PLT-MPBPL26MH000001",
      platformFee: 1500,
      cgst: 135,
      sgst: 135,
      total: 1770
    },
    customerPays: 37170,
    breakdown: {
      baseAmount: 30000,
      venueTotal: 35400,
      platformTotal: 1770,
      totalAmount: 37170
    }
  }
}
```

---

## Step 8: Frontend Shows Payment Summary

```jsx
<div className="payment-summary">
  <h2>Booking Summary</h2>
  
  <div className="booking-details">
    <p>Booking Number: MPBPL26MH000001</p>
    <p>Venue: Grand Banquet Hall</p>
    <p>Date: 15 March 2025</p>
    <p>Time: 10:00 AM - 6:00 PM</p>
  </div>
  
  <div className="price-breakdown">
    <h3>📄 Venue Invoice (VEN-MPBPL26MH000001)</h3>
    <table>
      <tr>
        <td>Base Booking</td>
        <td>₹10,000</td>
      </tr>
      <tr>
        <td>Amenities</td>
        <td>₹20,000</td>
      </tr>
      <tr>
        <td>Subtotal</td>
        <td>₹30,000</td>
      </tr>
      <tr>
        <td>CGST (9%)</td>
        <td>₹2,700</td>
      </tr>
      <tr>
        <td>SGST (9%)</td>
        <td>₹2,700</td>
      </tr>
      <tr className="total">
        <td><strong>Venue Total</strong></td>
        <td><strong>₹35,400</strong></td>
      </tr>
    </table>
    
    <h3>📄 Platform Invoice (PLT-MPBPL26MH000001)</h3>
    <table>
      <tr>
        <td>Platform Fee (5%)</td>
        <td>₹1,500</td>
      </tr>
      <tr>
        <td>CGST (9%)</td>
        <td>₹135</td>
      </tr>
      <tr>
        <td>SGST (9%)</td>
        <td>₹135</td>
      </tr>
      <tr className="total">
        <td><strong>Platform Total</strong></td>
        <td><strong>₹1,770</strong></td>
      </tr>
    </table>
    
    <div className="grand-total">
      <h2>Total Amount to Pay: ₹37,170</h2>
    </div>
  </div>
  
  <button onClick={handlePayment}>
    Proceed to Payment (₹37,170)
  </button>
</div>
```

---

## Step 9: Payment Gateway Integration

```javascript
// Create Razorpay Order
const handlePayment = async () => {
  // Call backend to create Razorpay order
  const orderResponse = await fetch('/api/payment/create-order', {
    method: 'POST',
    body: JSON.stringify({
      bookingId: "booking789",
      amount: 37170
    })
  });
  
  const { orderId } = await orderResponse.json();
  
  // Open Razorpay checkout
  const options = {
    key: process.env.RAZORPAY_KEY_ID,
    amount: 3717000, // Amount in paise (₹37,170 * 100)
    currency: "INR",
    name: "VenueHub",
    description: "Booking Payment - MPBPL26MH000001",
    order_id: orderId,
    handler: function (response) {
      // Payment successful
      verifyPayment(response);
    }
  };
  
  const rzp = new Razorpay(options);
  rzp.open();
};
```

---

## Step 10: Payment Success

```javascript
// After payment success
const verifyPayment = async (paymentData) => {
  const response = await fetch('/api/payment/verify', {
    method: 'POST',
    body: JSON.stringify({
      bookingId: "booking789",
      razorpay_order_id: paymentData.razorpay_order_id,
      razorpay_payment_id: paymentData.razorpay_payment_id,
      razorpay_signature: paymentData.razorpay_signature
    })
  });
  
  if (response.ok) {
    // Update booking status
    // Generate PDF invoices
    // Send email with invoices
    // Redirect to success page
  }
};
```

---

## Step 11: Post-Payment Actions

### 11.1 Update Booking Status
```javascript
booking.status = "confirmed";
booking.paymentStatus = "paid";
booking.paymentDetails = {
  razorpay_order_id: "order_xyz",
  razorpay_payment_id: "pay_abc",
  razorpay_signature: "signature_123",
  paidAt: new Date()
};
await booking.save();
```

### 11.2 Generate PDF Invoices
```javascript
// Generate Venue Invoice PDF
const venuePDF = await generateVenueInvoicePDF(booking);

// Generate Platform Invoice PDF
const platformPDF = await generatePlatformInvoicePDF(booking);
```

### 11.3 Send Email to Customer
```javascript
await sendEmail({
  to: "rahul@email.com",
  subject: "Booking Confirmed - MPBPL26MH000001",
  template: "booking-confirmation",
  data: {
    booking: booking,
    venueInvoice: booking.venueInvoice,
    platformInvoice: booking.platformInvoice
  },
  attachments: [
    { filename: "venue-invoice.pdf", content: venuePDF },
    { filename: "platform-invoice.pdf", content: platformPDF }
  ]
});
```

### 11.4 Send Notification to Venue Owner
```javascript
await sendEmail({
  to: venueOwner.email,
  subject: "New Booking Received - MPBPL26MH000001",
  template: "new-booking-owner",
  data: {
    booking: booking,
    customerDetails: booking.customerDetails
  }
});
```

---

## Step 12: Success Page

```jsx
<div className="booking-success">
  <div className="success-icon">✅</div>
  <h1>Booking Confirmed!</h1>
  <p>Booking Number: MPBPL26MH000001</p>
  
  <div className="booking-summary">
    <h3>Booking Details</h3>
    <p>Venue: Grand Banquet Hall</p>
    <p>Date: 15 March 2025</p>
    <p>Time: 10:00 AM - 6:00 PM</p>
    <p>Amount Paid: ₹37,170</p>
  </div>
  
  <div className="invoice-downloads">
    <h3>Download Invoices</h3>
    <button>📄 Download Venue Invoice</button>
    <button>📄 Download Platform Invoice</button>
    <button>📄 Download Both</button>
  </div>
  
  <div className="next-steps">
    <h3>What's Next?</h3>
    <ul>
      <li>✅ Confirmation email sent to your email</li>
      <li>✅ Venue owner has been notified</li>
      <li>📞 Venue will contact you within 24 hours</li>
      <li>📧 Check your email for invoices</li>
    </ul>
  </div>
  
  <button onClick={() => router.push('/customer/bookings')}>
    View My Bookings
  </button>
</div>
```

---

## 📊 Final Database State

```javascript
// Booking Document in MongoDB
{
  _id: ObjectId("booking789"),
  bookingNumber: "MPBPL26MH000001",
  venue: ObjectId("venue123"),
  customer: ObjectId("customer456"),
  bookingDate: ISODate("2025-03-15"),
  startTime: "10:00 AM",
  endTime: "6:00 PM",
  bookingType: "fullday",
  amount: 37170,
  
  selectedAmenities: {
    basic: [...],
    beverages: [...],
    lunchThalis: [...]
  },
  amenitiesTotal: 20000,
  
  priceBreakdown: {
    basePrice: 10000,
    amenitiesTotal: 20000,
    subtotal: 30000
  },
  
  venueInvoice: {
    invoiceNumber: "VEN-MPBPL26MH000001",
    amount: 30000,
    cgstRate: 9,
    cgst: 2700,
    sgstRate: 9,
    sgst: 2700,
    total: 35400,
    hsnCode: "9973"
  },
  
  platformInvoice: {
    invoiceNumber: "PLT-MPBPL26MH000001",
    platformFeeRate: 5,
    platformFee: 1500,
    cgstRate: 9,
    cgst: 135,
    sgstRate: 9,
    sgst: 135,
    total: 1770,
    hsnCode: "999799"
  },
  
  gstSettingsSnapshot: {
    venueCGST: 9,
    venueSGST: 9,
    venueHSN: "9973",
    platformFeePercentage: 5,
    platformCGST: 9,
    platformSGST: 9
  },
  
  customerDetails: {
    name: "Rahul Sharma",
    email: "rahul@email.com",
    phone: "9876543210",
    eventType: "Wedding",
    guestCount: 100,
    specialRequirements: "Need parking for 50 cars"
  },
  
  status: "confirmed",
  paymentStatus: "paid",
  paymentDetails: {
    razorpay_order_id: "order_xyz",
    razorpay_payment_id: "pay_abc",
    razorpay_signature: "signature_123",
    paidAt: ISODate("2025-03-15T10:35:00.000Z")
  },
  
  ownerEarnings: 30000,
  commission: 0,
  commissionRate: 0,
  
  createdAt: ISODate("2025-03-15T10:30:00.000Z"),
  updatedAt: ISODate("2025-03-15T10:35:00.000Z")
}
```

---

## 💰 Money Distribution

```
Customer Pays: ₹37,170
         │
         ├─────────────────────────────────────────┐
         │                                         │
         ▼                                         ▼
   Venue Invoice                          Platform Invoice
     ₹35,400                                  ₹1,770
         │                                         │
    ┌────┴────┐                              ┌────┴────┐
    │         │                              │         │
    ▼         ▼                              ▼         ▼
  Venue     GST                          Platform    GST
  Owner   to Govt                          Fee     to Govt
 ₹30,000  ₹5,400                          ₹1,500    ₹270
```

### Breakdown:
- **Venue Owner Gets**: ₹30,000 (base + amenities)
- **Government Gets**: ₹5,670 (₹5,400 + ₹270)
- **VenueHub Gets**: ₹1,500 (platform fee)
- **Total**: ₹37,170 ✅

---

## ✅ Summary

1. Customer selects venue and amenities
2. Frontend calculates subtotal
3. Backend fetches GST settings
4. Backend calculates 2 separate invoices
5. Booking saved with complete invoice data
6. Payment gateway integration
7. Payment success → Update booking
8. Generate PDF invoices
9. Send emails with invoices
10. Show success page with download links

**Result**: Professional, GST-compliant, 2-invoice system ready! 🎉
