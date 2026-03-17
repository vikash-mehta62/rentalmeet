# Invoice Flow Diagram - VenueHub

## 🔄 Complete Booking & Invoice Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOMER BOOKS VENUE                          │
│                    (₹10,000 base booking)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              FETCH PLATFORM GST SETTINGS                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Venue CGST: 9%        Platform Fee: 5%                  │   │
│  │  Venue SGST: 9%        Platform CGST: 9%                 │   │
│  │  Venue HSN: 9973       Platform SGST: 9%                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CALCULATE 2 INVOICES                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌──────────────────────┐        ┌──────────────────────┐
│   VENUE INVOICE      │        │  PLATFORM INVOICE    │
│   (Invoice 1)        │        │  (Invoice 2)         │
├──────────────────────┤        ├──────────────────────┤
│ Invoice: VEN-BK001   │        │ Invoice: PLT-BK001   │
│ HSN: 9973            │        │ HSN: 999799          │
│                      │        │                      │
│ Base: ₹10,000        │        │ Platform Fee: ₹500   │
│ CGST (9%): ₹900      │        │ CGST (9%): ₹45       │
│ SGST (9%): ₹900      │        │ SGST (9%): ₹45       │
│ ─────────────────    │        │ ─────────────────    │
│ Total: ₹11,800       │        │ Total: ₹590          │
└──────────┬───────────┘        └──────────┬───────────┘
           │                               │
           └───────────────┬───────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  CUSTOMER PAYS         │
              │  ₹12,390               │
              │  (₹11,800 + ₹590)      │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  PAYMENT GATEWAY       │
              │  (Razorpay)            │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  PAYMENT SUCCESS       │
              └────────────┬───────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌────────────────┐ ┌──────────────┐ ┌──────────────┐
│ SAVE BOOKING   │ │ GENERATE PDF │ │ SEND EMAIL   │
│ WITH INVOICES  │ │ INVOICES     │ │ TO CUSTOMER  │
└────────────────┘ └──────────────┘ └──────────────┘
```

---

## 💰 Money Flow Breakdown

```
CUSTOMER PAYMENT: ₹12,390
         │
         ├─────────────────────────────────────────┐
         │                                         │
         ▼                                         ▼
┌──────────────────────┐              ┌──────────────────────┐
│  VENUE INVOICE       │              │  PLATFORM INVOICE    │
│  ₹11,800             │              │  ₹590                │
└──────────┬───────────┘              └──────────┬───────────┘
           │                                     │
    ┌──────┴──────┐                       ┌─────┴─────┐
    │             │                       │           │
    ▼             ▼                       ▼           ▼
┌────────┐  ┌─────────┐            ┌─────────┐  ┌────────┐
│ VENUE  │  │   GST   │            │PLATFORM │  │  GST   │
│ OWNER  │  │ TO GOVT │            │  FEE    │  │TO GOVT │
│        │  │         │            │         │  │        │
│₹10,000 │  │ ₹1,800  │            │  ₹500   │  │  ₹90   │
└────────┘  └─────────┘            └─────────┘  └────────┘
```

---

## 📊 Database Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      BOOKING DOCUMENT                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  bookingNumber: "BK-20250315-001"                           │
│  amount: 12390                                              │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  priceBreakdown:                                   │    │
│  │    basePrice: 10000                                │    │
│  │    subtotal: 10000                                 │    │
│  │    total: 12390                                    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  venueInvoice:                                     │    │
│  │    invoiceNumber: "VEN-BK-20250315-001"           │    │
│  │    amount: 10000                                   │    │
│  │    cgstRate: 9                                     │    │
│  │    cgst: 900                                       │    │
│  │    sgstRate: 9                                     │    │
│  │    sgst: 900                                       │    │
│  │    total: 11800                                    │    │
│  │    hsnCode: "9973"                                 │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  platformInvoice:                                  │    │
│  │    invoiceNumber: "PLT-BK-20250315-001"           │    │
│  │    platformFeeRate: 5                              │    │
│  │    platformFee: 500                                │    │
│  │    cgstRate: 9                                     │    │
│  │    cgst: 45                                        │    │
│  │    sgstRate: 9                                     │    │
│  │    sgst: 45                                        │    │
│  │    total: 590                                      │    │
│  │    hsnCode: "999799"                               │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  gstSettingsSnapshot:                              │    │
│  │    venueCGST: 9                                    │    │
│  │    venueSGST: 9                                    │    │
│  │    platformFeePercentage: 5                        │    │
│  │    platformCGST: 9                                 │    │
│  │    platformSGST: 9                                 │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📧 Email Flow

```
┌──────────────────────────────────────────────────────────┐
│              BOOKING CONFIRMATION EMAIL                   │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  To: customer@email.com                                  │
│  Subject: Booking Confirmed - [Venue Name]               │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Email Body:                                    │    │
│  │  - Booking details                              │    │
│  │  - Payment summary                              │    │
│  │  - Venue information                            │    │
│  │  - Contact details                              │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Attachments:                                   │    │
│  │  📄 venue-invoice-VEN-BK001.pdf                 │    │
│  │  📄 platform-invoice-PLT-BK001.pdf              │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## 🎯 Invoice PDF Structure

### Venue Invoice PDF Layout

```
┌────────────────────────────────────────────────────────────┐
│  [Venue Logo]                    TAX INVOICE               │
│                              ORIGINAL For Recipient         │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Tax Invoice on behalf of:                                 │
│  Legal Entity Name: [Venue Owner Name]                     │
│  Venue Name: [Venue Name]                                  │
│  Venue Address: [Full Address]                             │
│  Venue GSTIN: [GST Number]                                 │
│  Invoice No: VEN-BK-20250315-001                           │
│  Invoice Date: 15/03/2025                                  │
│                                                             │
├────────────────────────────────────────────────────────────┤
│  Customer Details:                                         │
│  Name: [Customer Name]                                     │
│  Address: [Event Address]                                  │
│  State: [State Name]                                       │
├────────────────────────────────────────────────────────────┤
│  HSN Code: 9973                                            │
│  Service Description: Venue Rental Service                 │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Particulars  │ Amount │ CGST │ SGST │ Total         │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ Venue Booking│ 10,000 │  900 │  900 │ 11,800        │ │
│  │              │        │ (9%) │ (9%) │               │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  Amount in words: Eleven Thousand Eight Hundred Only       │
│                                                             │
│  Payment received via Razorpay                             │
│  Order ID: [Order ID]                                      │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Platform Invoice PDF Layout

```
┌────────────────────────────────────────────────────────────┐
│  [VenueHub Logo]                TAX INVOICE                │
│                              ORIGINAL For Recipient         │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  VENUEHUB / RENTALMEET                                     │
│  Address: [Office Address]                                 │
│  GSTIN: [VenueHub GST Number]                              │
│  PAN: [PAN Number]                                         │
│  Invoice No: PLT-BK-20250315-001                           │
│  Invoice Date: 15/03/2025                                  │
│                                                             │
├────────────────────────────────────────────────────────────┤
│  Customer Details:                                         │
│  Name: [Customer Name]                                     │
│  GSTIN: UNREGISTERED                                       │
│  Place of Supply: [State]                                  │
├────────────────────────────────────────────────────────────┤
│  HSN Code: 999799                                          │
│  Service Description: Platform Service Fee                 │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Particulars  │ Amount │ CGST │ SGST │ Total         │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ Platform Fee │   500  │  45  │  45  │  590          │ │
│  │              │        │ (9%) │ (9%) │               │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  Amount in words: Five Hundred Ninety Only                 │
│                                                             │
│  Payment received via Razorpay                             │
│  Order ID: [Order ID]                                      │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 🔄 API Flow

### 1. Create Booking API

```
POST /api/bookings

Request:
{
  "venueId": "venue123",
  "bookingDate": "2025-03-15",
  "customerDetails": {...},
  "selectedAmenities": {...}
}

Response:
{
  "success": true,
  "booking": {
    "bookingNumber": "BK-20250315-001",
    "amount": 12390,
    "venueInvoice": {
      "invoiceNumber": "VEN-BK-20250315-001",
      "total": 11800
    },
    "platformInvoice": {
      "invoiceNumber": "PLT-BK-20250315-001",
      "total": 590
    }
  }
}
```

### 2. Get Invoice PDF API

```
GET /api/bookings/:id/invoice/venue
GET /api/bookings/:id/invoice/platform

Response: PDF file download
```

### 3. Email Invoice API

```
POST /api/bookings/:id/send-invoices

Response:
{
  "success": true,
  "message": "Invoices sent successfully"
}
```

---

## 📱 Customer Dashboard View

```
┌────────────────────────────────────────────────────────┐
│              MY BOOKINGS                                │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Booking: BK-20250315-001                        │ │
│  │  Venue: Grand Banquet Hall                       │ │
│  │  Date: 15 March 2025                             │ │
│  │  Status: Confirmed                               │ │
│  │                                                   │ │
│  │  Payment: ₹12,390                                │ │
│  │                                                   │ │
│  │  ┌─────────────────────────────────────────────┐│ │
│  │  │  Venue Charges:        ₹11,800              ││ │
│  │  │  Platform Fee:         ₹590                 ││ │
│  │  └─────────────────────────────────────────────┘│ │
│  │                                                   │ │
│  │  📄 Download Invoices:                           │ │
│  │  [Download Venue Invoice]                        │ │
│  │  [Download Platform Invoice]                     │ │
│  │  [Download Both]                                 │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## 🎨 Summary

### Key Points:
1. ✅ 2 separate invoices generated
2. ✅ Different GSTIN for venue and platform
3. ✅ Different HSN codes (9973 vs 999799)
4. ✅ GST calculated separately on each
5. ✅ Customer gets both invoices
6. ✅ Proper audit trail maintained
7. ✅ GST compliant structure
8. ✅ Professional like Zomato/Swiggy

### Benefits:
- Clear separation of venue and platform revenue
- Proper GST compliance
- Easy tax filing for both parties
- Transparent for customers
- Professional invoicing system
- Audit-ready documentation
