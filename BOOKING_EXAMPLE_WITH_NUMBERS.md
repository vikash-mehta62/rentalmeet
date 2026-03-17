# Booking Example - Real Numbers

## 🎯 Real Life Example: Wedding Booking

---

## Customer: Rahul Sharma
## Venue: Grand Banquet Hall, Bhopal
## Date: 15 March 2025
## Event: Wedding Reception
## Guests: 100 people

---

## Step 1: Venue Selection

```
Venue: Grand Banquet Hall
Location: Bhopal, Madhya Pradesh
Base Price (Full Day): ₹10,000
Capacity: 150 people
```

---

## Step 2: Amenities Selection

### Basic Amenities
| Item | Rate | Quantity | Total |
|------|------|----------|-------|
| Projector | ₹1,000 | 1 | ₹1,000 |
| Sound System | ₹2,000 | 1 | ₹2,000 |
| **Subtotal** | | | **₹3,000** |

### Beverages
| Item | Rate/Unit | Quantity | Total |
|------|-----------|----------|-------|
| Tea/Coffee | ₹20 | 100 | ₹2,000 |
| **Subtotal** | | | **₹2,000** |

### Lunch Thalis
| Item | Rate/Plate | Quantity | Total |
|------|------------|----------|-------|
| Veg Thali | ₹150 | 100 | ₹15,000 |
| **Subtotal** | | | **₹15,000** |

### Total Amenities: ₹20,000

---

## Step 3: Price Calculation

```
Base Venue Price:     ₹10,000
Amenities Total:      ₹20,000
─────────────────────────────
Subtotal:             ₹30,000
```

---

## Step 4: GST Settings (From Platform)

```
Venue GST:
  CGST: 9%
  SGST: 9%
  HSN: 9973

Platform Fee:
  Rate: 5%
  CGST: 9%
  SGST: 9%
  HSN: 999799
```

---

## Step 5: Invoice Calculation

### 📄 INVOICE 1 - VENUE INVOICE

```
Invoice Number: VEN-MPBPL26MH000001
HSN Code: 9973 (Venue Rental Service)

┌─────────────────────────────────────────┐
│  VENUE INVOICE                          │
├─────────────────────────────────────────┤
│  Particulars              Amount        │
├─────────────────────────────────────────┤
│  Base Booking            ₹10,000        │
│  Amenities               ₹20,000        │
│  ─────────────────────────────────      │
│  Subtotal                ₹30,000        │
│                                         │
│  CGST (9%)               ₹2,700         │
│  SGST (9%)               ₹2,700         │
│  ─────────────────────────────────      │
│  TOTAL                   ₹35,400        │
└─────────────────────────────────────────┘

Amount in words:
Thirty Five Thousand Four Hundred Rupees Only
```

**Calculation:**
```
Subtotal:        ₹30,000
CGST (9%):       ₹30,000 × 9/100 = ₹2,700
SGST (9%):       ₹30,000 × 9/100 = ₹2,700
Total:           ₹30,000 + ₹2,700 + ₹2,700 = ₹35,400
```

---

### 📄 INVOICE 2 - PLATFORM INVOICE

```
Invoice Number: PLT-MPBPL26MH000001
HSN Code: 999799 (Platform Service)

┌─────────────────────────────────────────┐
│  PLATFORM INVOICE                       │
├─────────────────────────────────────────┤
│  Particulars              Amount        │
├─────────────────────────────────────────┤
│  Platform Fee (5%)       ₹1,500         │
│                                         │
│  CGST (9%)               ₹135           │
│  SGST (9%)               ₹135           │
│  ─────────────────────────────────      │
│  TOTAL                   ₹1,770         │
└─────────────────────────────────────────┘

Amount in words:
One Thousand Seven Hundred Seventy Rupees Only
```

**Calculation:**
```
Platform Fee:    ₹30,000 × 5/100 = ₹1,500
CGST (9%):       ₹1,500 × 9/100 = ₹135
SGST (9%):       ₹1,500 × 9/100 = ₹135
Total:           ₹1,500 + ₹135 + ₹135 = ₹1,770
```

---

## Step 6: Final Payment Summary

```
┌─────────────────────────────────────────────────┐
│         PAYMENT SUMMARY                         │
├─────────────────────────────────────────────────┤
│                                                 │
│  📄 Venue Invoice (VEN-MPBPL26MH000001)        │
│     Venue Charges:              ₹35,400        │
│                                                 │
│  📄 Platform Invoice (PLT-MPBPL26MH000001)     │
│     Platform Fee:               ₹1,770         │
│                                                 │
│  ═══════════════════════════════════════       │
│  💰 TOTAL AMOUNT TO PAY:        ₹37,170        │
│  ═══════════════════════════════════════       │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Step 7: Money Distribution

```
CUSTOMER PAYS: ₹37,170
         │
         │
    ┌────┴────────────────────────────────┐
    │                                     │
    ▼                                     ▼
┌─────────────────┐              ┌─────────────────┐
│ VENUE INVOICE   │              │PLATFORM INVOICE │
│   ₹35,400       │              │    ₹1,770       │
└────────┬────────┘              └────────┬────────┘
         │                                │
    ┌────┴────┐                      ┌────┴────┐
    │         │                      │         │
    ▼         ▼                      ▼         ▼
┌────────┐ ┌──────┐            ┌────────┐ ┌──────┐
│ VENUE  │ │ GST  │            │PLATFORM│ │ GST  │
│ OWNER  │ │GOVT  │            │  FEE   │ │GOVT  │
│        │ │      │            │        │ │      │
│₹30,000 │ │₹5,400│            │ ₹1,500 │ │ ₹270 │
└────────┘ └──────┘            └────────┘ └──────┘
```

### Distribution Breakdown:

1. **Venue Owner Receives**: ₹30,000
   - Base booking: ₹10,000
   - Amenities: ₹20,000

2. **Government Receives**: ₹5,670
   - From Venue Invoice: ₹5,400 (₹2,700 CGST + ₹2,700 SGST)
   - From Platform Invoice: ₹270 (₹135 CGST + ₹135 SGST)

3. **VenueHub Receives**: ₹1,500
   - Platform fee (5% of ₹30,000)

4. **Total**: ₹30,000 + ₹5,670 + ₹1,500 = ₹37,170 ✅

---

## Step 8: Database Entry

```javascript
{
  _id: "65f1234567890abcdef12345",
  bookingNumber: "MPBPL26MH000001",
  
  // Basic Info
  venue: "venue_id_123",
  customer: "customer_id_456",
  bookingDate: "2025-03-15",
  startTime: "10:00 AM",
  endTime: "6:00 PM",
  bookingType: "fullday",
  
  // Amount
  amount: 37170, // Total customer pays
  
  // Amenities
  selectedAmenities: {
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
  },
  amenitiesTotal: 20000,
  
  // Price Breakdown
  priceBreakdown: {
    basePrice: 10000,
    amenitiesTotal: 20000,
    subtotal: 30000
  },
  
  // Venue Invoice
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
  
  // Platform Invoice
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
  
  // Customer Details
  customerDetails: {
    name: "Rahul Sharma",
    email: "rahul@email.com",
    phone: "9876543210",
    eventType: "Wedding",
    guestCount: 100,
    specialRequirements: "Need parking for 50 cars"
  },
  
  // Status
  status: "confirmed",
  paymentStatus: "paid",
  
  // Payment Details
  paymentDetails: {
    razorpay_order_id: "order_MNopQRst123456",
    razorpay_payment_id: "pay_XYZabc789012",
    razorpay_signature: "signature_hash_here",
    paidAt: "2025-03-15T10:35:00.000Z"
  },
  
  // Owner Earnings
  ownerEarnings: 30000,
  commission: 0,
  commissionRate: 0,
  
  // Timestamps
  createdAt: "2025-03-15T10:30:00.000Z",
  updatedAt: "2025-03-15T10:35:00.000Z"
}
```

---

## Step 9: Email to Customer

```
From: VenueHub <noreply@venuehub.com>
To: rahul@email.com
Subject: Booking Confirmed - Grand Banquet Hall - MPBPL26MH000001

Dear Rahul Sharma,

Your booking has been confirmed! 🎉

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BOOKING DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Booking Number: MPBPL26MH000001
Venue: Grand Banquet Hall
Location: Bhopal, Madhya Pradesh
Date: 15 March 2025
Time: 10:00 AM - 6:00 PM
Event Type: Wedding
Guests: 100 people

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAYMENT SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Venue Charges:        ₹35,400
Platform Fee:         ₹1,770
─────────────────────────────
Total Paid:           ₹37,170

Payment Method: Razorpay
Payment ID: pay_XYZabc789012
Payment Date: 15 March 2025, 10:35 AM

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INVOICES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please find attached:
📄 Venue Invoice (VEN-MPBPL26MH000001)
📄 Platform Invoice (PLT-MPBPL26MH000001)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT'S NEXT?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Venue owner has been notified
✅ You will receive a confirmation call within 24 hours
✅ Visit your dashboard to view booking details
✅ Download invoices anytime from your account

Need help? Contact us at support@venuehub.com

Thank you for choosing VenueHub!

Best regards,
Team VenueHub
```

**Attachments:**
- venue-invoice-VEN-MPBPL26MH000001.pdf
- platform-invoice-PLT-MPBPL26MH000001.pdf

---

## Step 10: Customer Dashboard View

```
┌────────────────────────────────────────────────────────┐
│  MY BOOKINGS                                           │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │  🎉 CONFIRMED                                    │ │
│  │                                                   │ │
│  │  Booking: MPBPL26MH000001                        │ │
│  │  Venue: Grand Banquet Hall                       │ │
│  │  📅 15 March 2025                                │ │
│  │  🕐 10:00 AM - 6:00 PM                           │ │
│  │  👥 100 Guests                                   │ │
│  │                                                   │ │
│  │  ┌─────────────────────────────────────────────┐│ │
│  │  │  Payment Details                            ││ │
│  │  │  ─────────────────────────────────────      ││ │
│  │  │  Venue Charges:        ₹35,400              ││ │
│  │  │  Platform Fee:         ₹1,770               ││ │
│  │  │  ─────────────────────────────────────      ││ │
│  │  │  Total Paid:           ₹37,170              ││ │
│  │  │  Status: ✅ Paid                            ││ │
│  │  └─────────────────────────────────────────────┘│ │
│  │                                                   │ │
│  │  📄 Invoices:                                    │ │
│  │  [Download Venue Invoice]                        │ │
│  │  [Download Platform Invoice]                     │ │
│  │  [Download Both]                                 │ │
│  │                                                   │ │
│  │  [View Details] [Contact Venue] [Cancel]         │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## 📊 Summary Table

| Description | Amount |
|-------------|--------|
| **Base Booking** | ₹10,000 |
| **Amenities** | ₹20,000 |
| **Subtotal** | ₹30,000 |
| **Venue CGST (9%)** | ₹2,700 |
| **Venue SGST (9%)** | ₹2,700 |
| **Venue Total** | **₹35,400** |
| **Platform Fee (5%)** | ₹1,500 |
| **Platform CGST (9%)** | ₹135 |
| **Platform SGST (9%)** | ₹135 |
| **Platform Total** | **₹1,770** |
| **GRAND TOTAL** | **₹37,170** |

---

## ✅ Key Takeaways

1. **2 Separate Invoices**: Venue aur Platform ke liye alag
2. **Clear Breakdown**: Customer ko sab kuch transparent dikhta hai
3. **GST Compliant**: Proper CGST/SGST calculation
4. **Professional**: Zomato/Swiggy jaisa system
5. **Audit Ready**: Complete documentation
6. **Easy Tracking**: Unique invoice numbers

**System is Production Ready!** 🚀
