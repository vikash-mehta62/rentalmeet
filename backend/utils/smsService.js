const http = require('http');

/**
 * Sends SMS using the Custom SMS API Gateway
 * @param {string} phone - Recipient phone number (10 digits)
 * @param {string} name - Recipient's name
 * @param {string} otp - The OTP to send
 */
exports.sendSMS = async (phone, name, otp) => {
  return new Promise((resolve, reject) => {
    try {
      let formattedPhone = String(phone).trim();
      // Remove any non-digits
      formattedPhone = formattedPhone.replace(/\D/g, '');
      
      // Prepend India country code 91 if it's a 10-digit number
      if (formattedPhone.length === 10) {
        formattedPhone = '91' + formattedPhone;
      }

      // Exact approved DLT SMS Template:
      // "Dear {#var#}, use this One Time Password {#var#} to Sing-Up in to your Rental Meet account. This OTP will be valid for the next 10 mins. YUWAKA EDUTECH"
      const text = `Dear ${name}, use this One Time Password ${otp} to Sing-Up in to your Rental Meet account. This OTP will be valid for the next 10 mins. YUWAKA EDUTECH`;

      const apiKey = 'tXan70C3sEOlp6JJGjhBmA';
      const senderId = 'YUWAKA';
      const channel = 'Trans';
      const dcs = '0';
      const flashSms = '0';
      const route = '29';

      const url = `http://182.18.162.128/api/mt/SendSMS?Apikey=${apiKey}&senderid=${senderId}&channel=${channel}&DCS=${dcs}&flashsms=${flashSms}&number=${formattedPhone}&text=${encodeURIComponent(text)}&route=${route}`;

      console.log(`Sending SMS to ${formattedPhone} (Name: ${name}, OTP: ${otp})...`);

      http.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          console.log(`SMS Gateway Response for ${formattedPhone}:`, data);
          resolve({ success: true, data });
        });
      }).on('error', (err) => {
        console.error(`SMS Gateway Error for ${formattedPhone}:`, err.message);
        resolve({ success: false, error: err.message });
      });

    } catch (error) {
      console.error('Error in sendSMS service helper:', error);
      resolve({ success: false, error: error.message });
    }
  });
};
