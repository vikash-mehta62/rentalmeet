const normalizeFoodType = (value) => {
  const key = String(value || '').toLowerCase().replace(/[\s_-]+/g, '');
  if (key === 'veg') return 'Veg';
  if (key === 'nonveg') return 'Non Veg';
  if (key === 'both') return 'Both';
  return '';
};

module.exports = { normalizeFoodType };
