# 📋 Venue Owner - Offline Booking Feature Proposal

## 📌 1. Feature Kya Hai? (Overview)
Venue Owners ke liye ek **"Offline Booking"** ka system banaya ja raha hai. 
Iska use karke venue owner direct aane wale walk-in ya phone par aane wale customers ki booking apne dashboard se direct add kar sakega.

> **Sabse Zaroori Point:**
> Iska **Online Bookings** aur online payment gateway se **koi lena-dena nahi hoga**. Iska database table/model bilkul alag rahega taaki online system me koi confusion na ho.

---

## 🖥️ 2. Venue Owner Ko Kaise Dikhega? (Screen & Flow)

Venue Owner ke dashboard me sidebar me ek option aayega: **"Offline Bookings"**. 
Yahan ek hi single page par poora booking form open hoga:

---

### 🔹 Step 1: Customer Phone Number Check (Auto-Fill System)
* Sabse pehle Venue Owner customer ka **10-digit Mobile Number** dalega:
  * **Case 1 (Agar Customer Pehle Se Registered Hai):**
    * System turant check karega aur customer ka **Naam aur Email apne aap screen par fill ho jayega**.
  * **Case 2 (Agar Customer Naya Hai):**
    * Venue Owner customer ka **Naam aur Email type karega**.
    * Jaise hi booking save hogi, yeh naya customer hamare main database me **automatically register ho jayega**.
    * Saath me yeh tag lag jayega: `Created by Venue: [Venue Name/ID]`.
    * **Fayda:** Admin ko pata chalega ki yeh customer is specific venue ki offline booking ke zariye platform par aaya hai.

---

### 🔹 Step 2: Event Ki Details
* **Venue / Hall Selection:** (Agar ek owner ke multiple halls hain toh select karega).
* **Event Date:** Kis date ka function hai.
* **Slot / Time:** Morning / Evening / Full Day.
* **Event Type:** Wedding, Birthday, Anniversary, Corporate, Reception, etc.
* **Total Guests:** Expected kitne log aane wale hain (Optional).

---

### 🔹 Step 3: Payment & Balance Calculation (Auto Calculate)
Venue Owner ko hisaab rakhne me koi dikkat na ho, isliye automatic calculation rahega:

* **Total Amount (कुल रकम):** ₹ `[ Owner Type Karega ]`
* **Advance Paid (एडवांस मिला):** ₹ `[ Owner Type Karega ]`
* **Balance Due (बकाया राशि):** ₹ `[ System Apne Aap Calculate Karega (Total - Advance) ]`
* **Payment Mode:** Advance kisme mila? `(Cash / UPI-GPay-PhonePe / Cheque / Bank Transfer)`
* **Payment Status:** System apne aap status set kar dega:
  * `Paid` (Agar pura payment mil gaya, Balance = 0)
  * `Partially Paid` (Agar thoda advance mila aur baaki bacha hai)
  * `Pending` (Agar abhi kuch advance nahi mila)
* **Special Notes:** Koi special decoration, catering ya customer ki request ka note likhne ke liye.

---

## 📊 3. Booking Save Hone Ke Baad Kya Hoga?

1. **Offline Bookings List / Table:**
   * Venue owner ko ek saaf table milega jahan wo apni saari offline bookings dekh sakta hai.
   * **Filters:** Date wise filter, aur sabse zaroori **"Pending Balance"** filter (taki pata rahe kin-kin customer se abhi baki payment lena hai).
2. **Balance Update Feature:**
   * Jab customer bacha hua payment de dega, toh 1-click me owner uska balance update karke "Fully Paid" mark kar sakega.
3. **Receipt / Slip:**
   * Owner chahe toh customer ko ek printable/downloadable booking confirmation slip de sakega.

---

## 🔒 4. Admin Aur Platform Ke Fayde
1. **Platform Ka Customer Base Badhega:** Har offline customer hamare database me safe ho raha hai.
2. **Clear Audit & Tracking:** Admin panel me saaf dikhega ki kaun sa customer kis venue owner ke offline booking karne par add hua hai.
3. **Double Booking Se Bachav (Calendar Sync):** Agar venue owner ne offline booking daali hai, toh website par wo date online users ke liye "Booked/Unavailable" dikhegi taaki same din do alag-alag log book na kar sakein.

---

## ❓ 5. Client Se Final Confirmation (Feedback Checklist)

Yeh points review karke batayein:
- [ ] **1. Calendar Block:** Kya offline booking save hone par website par wo date online customers ke liye automatically "Booked / Block" ho jani chahiye? *(Hamari taraf se Recommended: Haan)*
- [ ] **2. Customer Confirmation Message:** Kya booking save hote hi customer ke mobile par SMS ya WhatsApp confirmation jaana chahiye, ya abhi ke liye sirf portal me entry tak hi rakhna hai?
- [ ] **3. Koi Extra Detail:** Kya koi aur aisi field hai jo aap form me chahte hain? (Jaise ID Proof Number, Menu/Food Package, etc.)
