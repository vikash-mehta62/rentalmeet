# GST Invoice Structure - VenueHub (RentalMeet)

## Overview
VenueHub me 2 alag-alag invoices generate honge har booking ke liye:
1. **Venue Invoice** - Venue owner ke liye (Restaurant invoice jaisa)
2. **Platform Invoice** - VenueHub/RentalMeet ke liye (Zomato platform fee invoice jaisa)

---

## 📄 Invoice 1: VENUE INVOICE (Venue Owner ke liye)

### Invoice Header
```
TAX INVOICE
ORIGINAL For Recipient

Tax Invoice on behalf of:
Legal Entity Name: [Venue Owner Name]
Venue Name: [Venue Name]
Venue Address: [Full Address]
Venue GSTIN: [Venue GST Number]
Venue FSSAI: [If applicable]
Invoice No: VEN-[Booking ID]
Invoice Date: [Booking Date]
```

### Customer Details
```
Customer Name: [Customer Name]
Delivery Address: [Event Address]
State name & Place of Supply: [State]
```

### Service Details
```
HSN Code: 9973 (Venue Rental Service)
Service Description: Venue Rental Service
```

### Invoice Table
| Particulars | Gross Value | Discount | Net Value | CGST (Rate) | CGST (INR) | SGST (Rate) | SGST (INR) | Total |
|-------------|-------------|----------|-----------|-------------|------------|-------------|------------|-------|
| Venue Booking | ₹10,000 | ₹0 | ₹10,000 | 9% | ₹900 | 9% | ₹900 | ₹11,800 |
| **Total Value** | | | **₹10,000** | | **₹900** | | **₹900** | **₹11,800** |

### Amount in Words
```
Amount (in words): Eleven Thousand Eight Hundred Rupees Only
```

### Payment Details
```
Amount of INR 11,800 settled through digital mode/payment received
against Order ID: [Order ID] dated [Date]
Supply attracts reverse charge: No
```

---

## 📄 Invoice 2: PLATFORM INVOICE (VenueHub/RentalMeet ke liye)

### Invoice Header
```
TAX INVOICE
ORIGINAL FOR RECIPIENT

VENUEHUB / RENTALMEET
(Platform Service Provider)

Address: [VenueHub Office Address]
PAN: [VenueHub PAN]
State: [State]
CIN: [Company CIN]
Email ID: support@venuehub.com
GSTIN: [VenueHub GSTIN]
Invoice No: PLT-[Booking ID]
Invoice Date: [Booking Date]
```

### Customer Details
```
Customer Details
Name: [Customer Name]
GSTIN: UNREGISTERED
Delivery Address: [Event Address]
Place of Supply: [State]
```

### Service Details
```
Service Details
HSN Code: 999799
Supply Description: Other Services N.E.C (Platform Fee)
```

### Invoice Table
| Sr.No | Particulars | Taxable Amount | CGST | SGST | Total |
|-------|-------------|----------------|------|------|-------|
| | Order ID: [Order ID] | | | | |
| | Order Date: [Date] | | | | |
| 1 | Platform Fee | ₹500 | ₹45 | ₹45 | ₹590 |
| | **Total** | **₹500** | **₹45** | **₹45** | **₹590** |

### Amount in Words
```
Amount of ₹590 settled through digital mode/payment received
against Order ID: [Order ID] dated [Date]
```

### Footer
```
Tax is not payable on reverse charge basis
```

---

## 💰 Complete Calculation Example

### Scenario: ₹10,000 Venue Booking

#### Settings:
- Venue CGST: 9%
- Venue SGST: 9%
- Platform Fee: 5%
- Platform CGST: 9%
- Platform SGST: 9%

#### Calculation:

**INVOICE 1 - VENUE INVOICE**
```
Booking Amount:        ₹10,000
CGST (9%):            +   ₹900
SGST (9%):            +   ₹900
─────────────────────────────
Venue Total:           ₹11,800
```

**INVOICE 2 - PLATFORM INVOICE**
```
Platform Fee (5%):     ₹500
CGST (9% on ₹500):    +  ₹45
SGST (9% on ₹500):    +  ₹45
─────────────────────────────
Platform Total:         ₹590
```

**FINAL PAYMENT**
```
Venue Invoice:         ₹11,800
Platform Invoice:      +   ₹590
═════════════════════════════
Customer Pays:         ₹12,390
```

---

## 🔄 Payment Flow

### Customer Payment: ₹12,390

1. **Venue Owner Gets**: ₹10,000 (Base booking amount)
2. **Government Gets**: 
   - From Venue: ₹900 (CGST) + ₹900 (SGST) = ₹1,800
   - From Platform: ₹45 (CGST) + ₹45 (SGST) = ₹90
   - **Total GST**: ₹1,890

3. **VenueHub/RentalMeet Gets**: ₹500 (Platform Fee)

---

## 📋 Database Fields Required

### Booking Model
```javascript
{
  // Venue Invoice Data
  venueInvoiceNumber: "VEN-12345",
  venueAmount: 10000,
  venueCGST: 900,
  venueSGST: 900,
  venueTotal: 11800,
  venueHSN: "9973",
  
  // Platform Invoice Data
  platformInvoiceNumber: "PLT-12345",
  platformFee: 500,
  platformCGST: 45,
  platformSGST: 90,
  platformTotal: 590,
  platformHSN: "999799",
  
  // Total
  customerPays: 12390,
  
  // GST Settings (snapshot at booking time)
  gstSettings: {
    venueCGST: 9,
    venueSGST: 9,
    platformFeePercentage: 5,
    platformCGST: 9,
    platformSGST: 9
  }
}
```

---

## 🎯 Key Points

1. **2 Separate Invoices**: Venue aur Platform ke liye alag-alag
2. **2 Different GSTIN**: Venue ka GSTIN aur Platform ka GSTIN
3. **2 Different HSN Codes**: 
   - Venue: 9973 (Venue Rental)
   - Platform: 999799 (Platform Service)
4. **GST Compliance**: Dono invoices GST compliant hain
5. **Customer Transparency**: Customer ko dono invoices milte hain
6. **Separate Tax Filing**: Venue aur Platform apna-apna GST file karenge

---

## 📊 Invoice Generation Logic

```javascript
// Venue Invoice
const venueAmount = bookingAmount;
const venueCGST = (venueAmount * venueCGSTRate) / 100;
const venueSGST = (venueAmount * venueSGSTRate) / 100;
const venueTotal = venueAmount + venueCGST + venueSGST;

// Platform Invoice
const platformFee = (bookingAmount * platformFeePercentage) / 100;
const platformCGST = (platformFee * platformCGSTRate) / 100;
const platformSGST = (platformFee * platformSGSTRate) / 100;
const platformTotal = platformFee + platformCGST + platformSGST;

// Customer Total
const customerPays = venueTotal + platformTotal;
```

---

## ✅ Benefits

1. **GST Compliant**: Fully compliant with Indian GST laws
2. **Transparent**: Customer ko clear breakdown milta hai
3. **Separate Accounting**: Venue aur Platform ka accounting alag
4. **Tax Filing**: Easy tax filing for both parties
5. **Audit Ready**: Proper documentation for audits
6. **Professional**: Zomato/Swiggy jaisa professional system

---

## 🚀 Next Steps

1. Update Booking Model with new fields
2. Create Invoice Generation Service
3. Update Booking Controller
4. Create PDF Invoice Templates
5. Email both invoices to customer
6. Add invoice download in customer dashboard
