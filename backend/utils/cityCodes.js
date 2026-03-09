// Indian city 3-letter codes mapping
const cityCodes = {
  // Major Cities
  'MUMBAI': 'BOM',
  'DELHI': 'DEL',
  'BANGALORE': 'BLR',
  'BENGALURU': 'BLR',
  'HYDERABAD': 'HYD',
  'CHENNAI': 'MAA',
  'KOLKATA': 'CCU',
  'PUNE': 'PNQ',
  'AHMEDABAD': 'AMD',
  'SURAT': 'STV',
  'JAIPUR': 'JAI',
  'LUCKNOW': 'LKO',
  'KANPUR': 'KNU',
  'NAGPUR': 'NAG',
  'INDORE': 'IDR',
  'THANE': 'THN',
  'BHOPAL': 'BPL',
  'VISAKHAPATNAM': 'VTZ',
  'PIMPRI-CHINCHWAD': 'PCH',
  'PATNA': 'PAT',
  'VADODARA': 'BDQ',
  'GHAZIABAD': 'GZB',
  'LUDHIANA': 'LUH',
  'AGRA': 'AGR',
  'NASHIK': 'ISK',
  'FARIDABAD': 'FBD',
  'MEERUT': 'MRT',
  'RAJKOT': 'RAJ',
  'KALYAN-DOMBIVLI': 'KYN',
  'VASAI-VIRAR': 'VVR',
  'VARANASI': 'VNS',
  'SRINAGAR': 'SXR',
  'AURANGABAD': 'IXU',
  'DHANBAD': 'DBD',
  'AMRITSAR': 'ATQ',
  'NAVI MUMBAI': 'NMB',
  'ALLAHABAD': 'IXD',
  'PRAYAGRAJ': 'IXD',
  'RANCHI': 'IXR',
  'HOWRAH': 'HWH',
  'COIMBATORE': 'CJB',
  'JABALPUR': 'JLR',
  'GWALIOR': 'GWL',
  'VIJAYAWADA': 'VGA',
  'JODHPUR': 'JDH',
  'MADURAI': 'IXM',
  'RAIPUR': 'RPR',
  'KOTA': 'KTU',
  'CHANDIGARH': 'IXC',
  'GUWAHATI': 'GAU',
  'SOLAPUR': 'SSE',
  'HUBLI-DHARWAD': 'HBX',
  'MYSORE': 'MYQ',
  'MYSURU': 'MYQ',
  'TIRUCHIRAPPALLI': 'TRZ',
  'BAREILLY': 'BEK',
  'ALIGARH': 'ALG',
  'TIRUPPUR': 'TUP',
  'MORADABAD': 'MBD',
  'JALANDHAR': 'JUC',
  'BHUBANESWAR': 'BBI',
  'SALEM': 'SXV',
  'WARANGAL': 'WGC',
  'MIRA-BHAYANDAR': 'MBY',
  'THIRUVANANTHAPURAM': 'TRV',
  'GUNTUR': 'GNT',
  'BHIWANDI': 'BHI',
  'SAHARANPUR': 'SRE',
  'GORAKHPUR': 'GOP',
  'BIKANER': 'BKB',
  'AMRAVATI': 'AMV',
  'NOIDA': 'NOI',
  'JAMSHEDPUR': 'IXW',
  'BHILAI': 'BHI',
  'CUTTACK': 'CTC',
  'FIROZABAD': 'FZD',
  'KOCHI': 'COK',
  'COCHIN': 'COK',
  'NELLORE': 'NLR',
  'BHAVNAGAR': 'BHU',
  'DEHRADUN': 'DED',
  'DURGAPUR': 'RDP',
  'ASANSOL': 'ASN',
  'ROURKELA': 'ROU',
  'NANDED': 'NDC',
  'KOLHAPUR': 'KOP',
  'AJMER': 'AJM',
  'AKOLA': 'AKD',
  'GULBARGA': 'GUL',
  'JAMNAGAR': 'JGA',
  'UJJAIN': 'UJN',
  'LONI': 'LON',
  'SILIGURI': 'IXB',
  'JHANSI': 'JHS',
  'ULHASNAGAR': 'ULH',
  'JAMMU': 'IXJ',
  'SANGLI-MIRAJ-KUPWAD': 'SMK',
  'MANGALORE': 'IXE',
  'ERODE': 'ERD',
  'BELGAUM': 'IXG',
  'AMBATTUR': 'AMB',
  'TIRUNELVELI': 'TEN',
  'MALEGAON': 'MLG',
  'GAYA': 'GAY',
  'JALGAON': 'JLG',
  'UDAIPUR': 'UDR',
  'MAHESHTALA': 'MHS'
};

// Function to get city code
const getCityCode = (cityName) => {
  if (!cityName) return 'XXX';
  
  const normalizedCity = cityName.toUpperCase().trim();
  
  // Check if exact match exists
  if (cityCodes[normalizedCity]) {
    return cityCodes[normalizedCity];
  }
  
  // Try to find partial match
  for (const [city, code] of Object.entries(cityCodes)) {
    if (normalizedCity.includes(city) || city.includes(normalizedCity)) {
      return code;
    }
  }
  
  // If no match found, generate code from first 3 letters
  return normalizedCity.substring(0, 3).padEnd(3, 'X');
};

// Function to get state code (2 letters)
const getStateCode = (stateName) => {
  if (!stateName) return 'XX';
  
  const stateCodeMap = {
    'ANDHRA PRADESH': 'AP',
    'ARUNACHAL PRADESH': 'AR',
    'ASSAM': 'AS',
    'BIHAR': 'BR',
    'CHHATTISGARH': 'CG',
    'GOA': 'GA',
    'GUJARAT': 'GJ',
    'HARYANA': 'HR',
    'HIMACHAL PRADESH': 'HP',
    'JHARKHAND': 'JH',
    'KARNATAKA': 'KA',
    'KERALA': 'KL',
    'MADHYA PRADESH': 'MP',
    'MAHARASHTRA': 'MH',
    'MANIPUR': 'MN',
    'MEGHALAYA': 'ML',
    'MIZORAM': 'MZ',
    'NAGALAND': 'NL',
    'ODISHA': 'OR',
    'PUNJAB': 'PB',
    'RAJASTHAN': 'RJ',
    'SIKKIM': 'SK',
    'TAMIL NADU': 'TN',
    'TELANGANA': 'TG',
    'TRIPURA': 'TR',
    'UTTAR PRADESH': 'UP',
    'UTTARAKHAND': 'UK',
    'WEST BENGAL': 'WB',
    'ANDAMAN AND NICOBAR ISLANDS': 'AN',
    'CHANDIGARH': 'CH',
    'DADRA AND NAGAR HAVELI AND DAMAN AND DIU': 'DD',
    'DELHI': 'DL',
    'JAMMU AND KASHMIR': 'JK',
    'LADAKH': 'LA',
    'LAKSHADWEEP': 'LD',
    'PUDUCHERRY': 'PY'
  };
  
  const normalizedState = stateName.toUpperCase().trim();
  return stateCodeMap[normalizedState] || normalizedState.substring(0, 2);
};

module.exports = {
  getCityCode,
  getStateCode,
  cityCodes
};
