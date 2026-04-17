'use client';

import { useForm } from 'react-hook-form';
import { useVenueFormStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { Coffee, Utensils, Wifi, Shield, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';

const basicAmenities = [
  'High-Speed WiFi', 'Air Conditioning', 'Projector', 'Projection Screen',
  'Whiteboard', 'Sound System', 'Microphone', 'LED / Smart TV',
  'Video Conferencing', 'Conference Phone', 'Comfortable Seating',
  'Printing / Photocopy'
];

// Default amenities (always included, locked)
const defaultAmenities = [
  { name: 'First Aid Box', type: 'Included', locked: true },
  { name: 'Fire & Safety', type: 'Included', locked: true }
];

const beverages = [
  { name: 'Tea', unit: 'Per Cup' },
  { name: 'Coffee', unit: 'Per Cup' },
  { name: 'Water Bottle (250ml)', unit: 'Per Bottle' },
  { name: 'Water Bottle (500ml)', unit: 'Per Bottle' },
  { name: 'Water Bottle (1 Ltr)', unit: 'Per Bottle' },
  { name: 'Water Bottle (2 Ltr)', unit: 'Per Bottle' },
  { name: 'Water Dispenser (20 Ltr)', unit: 'Per Dispenser' },
  { name: 'Soft Drink (250ml)', unit: 'Per Bottle' },
  { name: 'Soft Drink (750ml)', unit: 'Per Bottle' },
  { name: 'Soft Drink (1/1.25 Ltr)', unit: 'Per Bottle' },
  { name: 'Soft Drink (2/2.25 Ltr)', unit: 'Per Bottle' },
];

const breakfastPacks = [
  { name: 'Breakfast Pack (1 Item)', items: 1 },
  { name: 'Breakfast Pack (2 Items)', items: 2 },
  { name: 'Breakfast Pack (3 Items)', items: 3 }
];

const thaliTypes = [
  'North Indian Thali',
  'Punjabi Thali',
  'Non-Veg Thali',
  'South Indian Thali',
  'Gujarati Thali',
  'Rajasthani Thali',
  'Bengali Thali',
  'Maharashtrian Thali',
  'Kashmiri Thali',
  'Simple/Daily Thali',
  'Protein-Packed Thali',
  'Festive/Banquet Thali'
];

const thaliCategories = ['Regular Thali', 'Special Thali', 'Maharaja Thali'];

const additionalFacilities = [
  'Separate Washrooms', 'Power Backup', 'Security Personnel',
  'Daily Cleaning', 'Reception Service', 'Storage Space',
  'Valet Parking', 'Wheelchair Access', 'Elevator'
];

export default function Step3Amenities() {
  const { formData, setFormData, setStep } = useVenueFormStore();
  
  // Prepare default values from existing amenities data
  const prepareDefaultValues = () => {
    const defaults = {};
    
    // Beverages
    if (formData.amenities?.beverages) {
      defaults.beverages = beverages.map((bev, index) => {
        const existing = formData.amenities.beverages.find(b => b.name === bev.name);
        return {
          available: existing?.available || false,
          rate: existing?.ratePerUnit || 0,
          brand: existing?.brand || ''
        };
      });
    }
    
    // Food - Snacks
    if (formData.amenities?.refreshmentFood) {
      const snacks = formData.amenities.refreshmentFood.find(f => f.name?.includes('Snacks'));
      if (snacks) {
        defaults.food = {
          snacks: {
            available: snacks.available || false,
            rate: snacks.ratePerPlate || 0,
            items: snacks.items || ''
          }
        };
      }
    }
    
    // Breakfast Packs
    if (formData.amenities?.refreshmentFood) {
      defaults.breakfast = breakfastPacks.map((pack, index) => {
        const existing = formData.amenities.refreshmentFood.find(f => f.name === pack.name);
        return {
          available: existing?.available || false,
          rate: existing?.ratePerPlate || 0,
          items: existing?.items || ''
        };
      });
    }
    
    // Lunch Thalis
    if (formData.amenities?.lunchThalis) {
      defaults.thalis = thaliTypes.map((thali, index) => {
        const existing = formData.amenities.lunchThalis.find(t => t.type === thali);
        return {
          available: existing?.available || false,
          rate: existing?.ratePerPlate || 0,
          items: existing?.numberOfItems || 0,
          itemNames: existing?.itemNames || ''
        };
      });
    }
    
    // Kitchen Access
    if (formData.amenities?.kitchenAccess) {
      defaults.kitchenAccess = {
        available: formData.amenities.kitchenAccess.available || false,
        type: formData.amenities.kitchenAccess.type || 'Included',
        charges: formData.amenities.kitchenAccess.charges || 0
      };
    }
    
    // Dining Area
    if (formData.amenities?.diningArea) {
      defaults.diningArea = {
        available: formData.amenities.diningArea.available || false,
        type: formData.amenities.diningArea.type || 'Included',
        charges: formData.amenities.diningArea.charges || 0
      };
    }
    
    return defaults;
  };
  
  const { register, handleSubmit, watch, reset } = useForm({
    defaultValues: prepareDefaultValues()
  });

  const [selectedAmenities, setSelectedAmenities] = useState(formData.amenities?.basic || []);
  const [selectedAdditional, setSelectedAdditional] = useState(formData.amenities?.additional || []);
  const [selectedThalis, setSelectedThalis] = useState(formData.amenities?.lunchThalis || []);
  
  // Reset form when formData changes (for edit mode)
  useEffect(() => {
    if (formData.amenities) {
      reset(prepareDefaultValues());
      setSelectedAmenities(formData.amenities?.basic || []);
      setSelectedAdditional(formData.amenities?.additional || []);
      setSelectedThalis(formData.amenities?.lunchThalis || []);
    }
  }, [formData.amenities]);

  const onSubmit = (data) => {
    // Prepare amenities data in correct format for backend
    const amenitiesData = {
      // Basic amenities (user selected + default locked)
      basic: [
        ...selectedAmenities,
        ...defaultAmenities.map(d => ({ name: d.name, available: true, type: 'Included', rate: 0 }))
      ],
      
      // Beverages - only include if available is true
      beverages: beverages
        .map((bev, index) => ({
          name: bev.name,
          available: data.beverages?.[index]?.available || false,
          ratePerUnit: Number(data.beverages?.[index]?.rate) || 0,
          brand: data.beverages?.[index]?.brand || ''
        }))
        .filter(b => b.available && b.name), // Ensure name exists
      
      // Refreshment Food (Snacks + Breakfast)
      refreshmentFood: [
        // Snacks
        ...(data.food?.snacks?.available ? [{
          name: 'Snacks Pack (3 Items)',
          available: true,
          ratePerPlate: Number(data.food.snacks.rate) || 0,
          items: data.food.snacks.items || '3 Items'
        }] : []),
        // Breakfast packs
        ...breakfastPacks.map((pack, index) => ({
          name: pack.name,
          available: data.breakfast?.[index]?.available || false,
          ratePerPlate: Number(data.breakfast?.[index]?.rate) || 0,
          items: data.breakfast?.[index]?.items || ''
        })).filter(b => b.available)
      ],
      
      // Lunch Thalis - new structure
      lunchThalis: selectedThalis.filter(t => t.categories.length > 0),
      
      // Kitchen Access
      kitchenAccess: {
        available: data.kitchenAccess?.available || false,
        type: data.kitchenAccess?.type || 'Included',
        charges: Number(data.kitchenAccess?.charges) || 0
      },
      
      // Dining Area
      diningArea: {
        available: data.diningArea?.available || false,
        type: data.diningArea?.type || 'Included',
        charges: Number(data.diningArea?.charges) || 0
      },
      
      // Additional Facilities
      additional: selectedAdditional
    };
    
    setFormData({ amenities: amenitiesData });
    setStep(4);
    toast.success('Amenities saved! 🎉');
  };

  const goBack = () => {
    setStep(2);
  };

  const toggleAmenity = (amenity) => {
    const exists = selectedAmenities.find(a => a.name === amenity);
    if (exists) {
      setSelectedAmenities(prev => prev.filter(a => a.name !== amenity));
    } else {
      setSelectedAmenities(prev => [...prev, { 
        name: amenity, 
        available: true, 
        type: 'Included', 
        rate: 0,
        rateType: 'Fixed' // Default to Fixed
      }]);
    }
  };

  const updateAmenityType = (amenityName, type) => {
    setSelectedAmenities(prev => prev.map(a => 
      a.name === amenityName ? { ...a, type, rate: type === 'Included' ? 0 : a.rate } : a
    ));
  };

  const updateAmenityRate = (amenityName, rate) => {
    setSelectedAmenities(prev => prev.map(a => 
      a.name === amenityName ? { ...a, rate: Number(rate) } : a
    ));
  };

  const updateAmenityRateType = (amenityName, rateType) => {
    setSelectedAmenities(prev => prev.map(a => 
      a.name === amenityName ? { ...a, rateType } : a
    ));
  };

  const toggleAdditionalFacility = (facility) => {
    const exists = selectedAdditional.find(a => a.name === facility);
    if (exists) {
      setSelectedAdditional(prev => prev.filter(a => a.name !== facility));
    } else {
      setSelectedAdditional(prev => [...prev, { 
        name: facility, 
        available: true, 
        type: 'Included', 
        charges: 0 
      }]);
    }
  };

  const updateAdditionalType = (facilityName, type) => {
    setSelectedAdditional(prev => prev.map(a => 
      a.name === facilityName ? { ...a, type, charges: type === 'Included' ? 0 : a.charges } : a
    ));
  };

  const updateAdditionalCharges = (facilityName, charges) => {
    setSelectedAdditional(prev => prev.map(a => 
      a.name === facilityName ? { ...a, charges: Number(charges) } : a
    ));
  };

  // Thali management functions
  const addThaliType = (thaliType) => {
    if (!selectedThalis.find(t => t.thaliType === thaliType)) {
      setSelectedThalis(prev => [...prev, {
        thaliType,
        available: true,
        categories: []
      }]);
    }
  };

  const removeThaliType = (thaliType) => {
    setSelectedThalis(prev => prev.filter(t => t.thaliType !== thaliType));
  };

  const toggleThaliCategory = (thaliType, category) => {
    setSelectedThalis(prev => prev.map(thali => {
      if (thali.thaliType === thaliType) {
        const categoryExists = thali.categories.find(c => c.category === category);
        if (categoryExists) {
          return {
            ...thali,
            categories: thali.categories.filter(c => c.category !== category)
          };
        } else {
          return {
            ...thali,
            categories: [...thali.categories, {
              category,
              ratePerPlate: 0,
              numberOfItems: 0,
              itemNames: ''
            }]
          };
        }
      }
      return thali;
    }));
  };

  const updateThaliCategory = (thaliType, category, field, value) => {
    setSelectedThalis(prev => prev.map(thali => {
      if (thali.thaliType === thaliType) {
        return {
          ...thali,
          categories: thali.categories.map(cat => 
            cat.category === category ? { ...cat, [field]: value } : cat
          )
        };
      }
      return thali;
    }));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-slide-up">
      {/* Basic Amenities */}
      <div className="bg-primary-50 border-l-4 border-primary-500 rounded-xl p-5">
        <div className="flex items-start">
          <Wifi className="w-6 h-6 text-primary-500 mr-3 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-dark-800 mb-3">Basic Amenities</h3>
            <p className="text-sm text-gray-600 mb-4">Select amenities and specify if they are included or paid</p>
            
            {/* Default Amenities (Locked) */}
            <div className="mb-4 space-y-3">
              {defaultAmenities.map((amenity) => (
                <div key={amenity.name} className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="w-5 h-5 rounded border-green-400 text-green-500 opacity-50"
                    />
                    <span className="text-sm font-medium text-green-800 flex-1">{amenity.name}</span>
                    <span className="text-xs text-green-700 bg-green-200 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Included (Default)
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* User Selectable Amenities */}
            <div className="space-y-3">
              {basicAmenities.map((amenity) => {
                const selected = selectedAmenities.find(a => a.name === amenity);
                return (
                  <div key={amenity} className={`rounded-lg p-4 border-2 transition-all ${
                    selected ? 'bg-white border-primary-300' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={() => toggleAmenity(amenity)}
                        className="w-5 h-5 rounded border-dark-200 text-primary-500 focus:ring-primary-500 mt-1"
                      />
                      
                      <div className="flex-1">
                        <span className="text-sm font-medium text-dark-700">{amenity}</span>
                        
                        {selected && (
                          <div className="flex items-center gap-3 mt-3 flex-wrap">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={selected.type === 'Included'}
                                onChange={() => updateAmenityType(amenity, 'Included')}
                                className="w-4 h-4 text-green-500"
                              />
                              <span className="text-xs text-green-700 font-medium">Included</span>
                            </label>
                            
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={selected.type === 'Paid'}
                                onChange={() => updateAmenityType(amenity, 'Paid')}
                                className="w-4 h-4 text-orange-500"
                              />
                              <span className="text-xs text-orange-700 font-medium">Paid</span>
                            </label>
                            
                            {selected.type === 'Paid' && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-gray-600">Rate:</span>
                                <input
                                  type="number"
                                  value={selected.rate || ''}
                                  onChange={(e) => updateAmenityRate(amenity, e.target.value)}
                                  placeholder="₹"
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                  min="0"
                                />
                                <select
                                  value={selected.rateType || 'Fixed'}
                                  onChange={(e) => updateAmenityRateType(amenity, e.target.value)}
                                  className="px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                                >
                                  <option value="Fixed">Fixed</option>
                                  <option value="Per Use">Per Use</option>
                                </select>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Beverages */}
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-5">
        <div className="flex items-start">
          <Coffee className="w-6 h-6 text-blue-500 mr-3 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-dark-800 mb-3">Beverages</h3>
            <p className="text-sm text-gray-600 mb-4">Select available beverages and set rates</p>
            <div className="space-y-3">
              {beverages.map((beverage, index) => {
                const isChecked = watch(`beverages.${index}.available`);
                return (
                <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 flex-wrap">
                  <input
                    type="checkbox"
                    {...register(`beverages.${index}.available`)}
                    className="w-5 h-5 rounded border-dark-200 text-primary-500"
                  />
                  <span className="text-sm font-medium flex-1 min-w-[150px]">{beverage.name}</span>
                  <input
                    type="number"
                    {...register(`beverages.${index}.rate`)}
                    placeholder="Rate"
                    className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    min="0"
                    disabled={!isChecked}
                  />
                  <span className="text-xs text-gray-500 min-w-[80px]">{beverage.unit}</span>
                  <input
                    type="text"
                    {...register(`beverages.${index}.brand`)}
                    placeholder="Brand (optional)"
                    className="w-32 px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={!isChecked}
                  />
                </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Food Options */}
      <div className="bg-green-50 border-l-4 border-green-500 rounded-xl p-5">
        <div className="flex items-start">
          <Utensils className="w-6 h-6 text-green-500 mr-3 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-dark-800 mb-3">Food Options</h3>
            
            {/* Snacks */}
            <div className="mb-4">
              <h4 className="font-semibold text-dark-700 mb-2">Snacks</h4>
              {(() => {
                const isChecked = watch('food.snacks.available');
                return (
                <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 flex-wrap">
                  <input type="checkbox" {...register('food.snacks.available')} className="w-5 h-5 rounded border-dark-200 text-primary-500" />
                  <span className="text-sm font-medium flex-1 min-w-[150px]">Snacks Pack (3 Items)</span>
                  <input type="number" {...register('food.snacks.rate')} placeholder="Rate per plate" className="w-32 px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:cursor-not-allowed" min="0" disabled={!isChecked} />
                  <input type="text" {...register('food.snacks.items')} placeholder="Item names" className="w-48 px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:cursor-not-allowed" disabled={!isChecked} />
                </div>
                );
              })()}
            </div>

            {/* Breakfast Packs */}
            <div className="mb-4">
              <h4 className="font-semibold text-dark-700 mb-2">Breakfast Packs</h4>
              <div className="space-y-2">
                {breakfastPacks.map((pack, index) => {
                  const isChecked = watch(`breakfast.${index}.available`);
                  return (
                  <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 flex-wrap">
                    <input type="checkbox" {...register(`breakfast.${index}.available`)} className="w-5 h-5 rounded border-dark-200 text-primary-500" />
                    <span className="text-sm font-medium flex-1 min-w-[150px]">{pack.name}</span>
                    <input type="number" {...register(`breakfast.${index}.rate`)} placeholder="Rate per plate" className="w-32 px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:cursor-not-allowed" min="0" disabled={!isChecked} />
                    <input type="text" {...register(`breakfast.${index}.items`)} placeholder="Item names" className="w-48 px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:cursor-not-allowed" disabled={!isChecked} />
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Lunch Thalis - New Structure */}
            <h4 className="font-semibold text-dark-700 mb-3 mt-6">Lunch Thalis</h4>
            <p className="text-xs text-gray-600 mb-3">Select thali type, then choose categories (Regular/Special/Maharaja)</p>
            
            {/* Add Thali Type Dropdown */}
            <div className="mb-4">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addThaliType(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                defaultValue=""
              >
                <option value="" disabled>+ Add Thali Type</option>
                {thaliTypes.filter(type => !selectedThalis.find(t => t.thaliType === type)).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Selected Thalis */}
            <div className="space-y-4">
              {selectedThalis.map((thali) => (
                <div key={thali.thaliType} className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-4">
                  {/* Thali Type Header */}
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-bold text-orange-900">{thali.thaliType}</h5>
                    <button
                      type="button"
                      onClick={() => removeThaliType(thali.thaliType)}
                      className="text-red-600 hover:text-red-800 text-sm font-semibold"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Categories */}
                  <div className="space-y-3">
                    {thaliCategories.map((category) => {
                      const selectedCategory = thali.categories.find(c => c.category === category);
                      const uniqueKey = `${thali.thaliType}-${category}`;
                      return (
                        <div key={uniqueKey} className="bg-white rounded-lg p-3 border border-orange-200">
                          {/* Category Checkbox */}
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              id={uniqueKey}
                              checked={!!selectedCategory}
                              onChange={() => toggleThaliCategory(thali.thaliType, category)}
                              className="w-5 h-5 rounded border-orange-300 text-orange-500"
                            />
                            <label htmlFor={uniqueKey} className="text-sm font-semibold text-gray-800 cursor-pointer">
                              {category}
                            </label>
                          </div>

                          {/* Category Details */}
                          {selectedCategory && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 pl-7">
                              <div>
                                <label className="text-xs text-gray-600 block mb-1">₹ Rate per Plate</label>
                                <input
                                  type="number"
                                  value={selectedCategory.ratePerPlate || ''}
                                  onChange={(e) => updateThaliCategory(thali.thaliType, category, 'ratePerPlate', Number(e.target.value))}
                                  placeholder="Rate"
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                  min="0"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 block mb-1"># Items</label>
                                <input
                                  type="number"
                                  value={selectedCategory.numberOfItems || ''}
                                  onChange={(e) => updateThaliCategory(thali.thaliType, category, 'numberOfItems', Number(e.target.value))}
                                  placeholder="Items"
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                  min="0"
                                />
                              </div>
                              <div className="md:col-span-1">
                                <label className="text-xs text-gray-600 block mb-1">Item Names</label>
                                <input
                                  type="text"
                                  value={selectedCategory.itemNames || ''}
                                  onChange={(e) => updateThaliCategory(thali.thaliType, category, 'itemNames', e.target.value)}
                                  placeholder="e.g., Dal, Rice, Roti..."
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {selectedThalis.length === 0 && (
              <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-sm text-gray-500">No thalis added yet. Select from dropdown above.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kitchen Access & Dining Area */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h4 className="font-semibold text-dark-800 mb-3">Kitchen Access</h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('kitchenAccess.available')}
                className="w-5 h-5 rounded border-dark-200 text-primary-500"
              />
              <span className="ml-2 text-sm">Available</span>
            </label>
            <select
              {...register('kitchenAccess.type')}
              className="input-field"
            >
              <option value="Included">Included</option>
              <option value="Paid">Paid</option>
            </select>
            {watch('kitchenAccess.type') === 'Paid' && (
              <input
                type="number"
                {...register('kitchenAccess.charges')}
                placeholder="Charges (₹)"
                className="input-field"
                min="0"
              />
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h4 className="font-semibold text-dark-800 mb-3">Dining Area</h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('diningArea.available')}
                className="w-5 h-5 rounded border-dark-200 text-primary-500"
              />
              <span className="ml-2 text-sm">Available</span>
            </label>
            <select
              {...register('diningArea.type')}
              className="input-field"
            >
              <option value="Included">Included</option>
              <option value="Paid">Paid</option>
            </select>
            {watch('diningArea.type') === 'Paid' && (
              <input
                type="number"
                {...register('diningArea.charges')}
                placeholder="Charges (₹)"
                className="input-field"
                min="0"
              />
            )}
          </div>
        </div>
      </div>

      {/* Additional Facilities */}
      <div className="bg-purple-50 border-l-4 border-purple-500 rounded-xl p-5">
        <div className="flex items-start">
          <Shield className="w-6 h-6 text-purple-500 mr-3 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-dark-800 mb-3">Additional Facilities</h3>
            <p className="text-sm text-gray-600 mb-4">Select facilities and specify if they are included or paid</p>
            <div className="space-y-3">
              {additionalFacilities.map((facility) => {
                const selected = selectedAdditional.find(a => a.name === facility);
                return (
                  <div key={facility} className={`rounded-lg p-4 border-2 transition-all ${
                    selected ? 'bg-white border-primary-300' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={() => toggleAdditionalFacility(facility)}
                        className="w-5 h-5 rounded border-dark-200 text-primary-500 focus:ring-primary-500 mt-1"
                      />
                      
                      <div className="flex-1">
                        <span className="text-sm font-medium text-dark-700">{facility}</span>
                        
                        {selected && (
                          <div className="flex items-center gap-3 mt-3 flex-wrap">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={selected.type === 'Included'}
                                onChange={() => updateAdditionalType(facility, 'Included')}
                                className="w-4 h-4 text-green-500"
                              />
                              <span className="text-xs text-green-700 font-medium">Included</span>
                            </label>
                            
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={selected.type === 'Paid'}
                                onChange={() => updateAdditionalType(facility, 'Paid')}
                                className="w-4 h-4 text-orange-500"
                              />
                              <span className="text-xs text-orange-700 font-medium">Paid</span>
                            </label>
                            
                            {selected.type === 'Paid' && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600">Charges:</span>
                                <input
                                  type="number"
                                  value={selected.charges || ''}
                                  onChange={(e) => updateAdditionalCharges(facility, e.target.value)}
                                  placeholder="₹"
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                  min="0"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={goBack}
          className="btn-secondary flex items-center group"
        >
          <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>
        <button
          type="submit"
          className="btn-primary flex items-center group"
        >
          Next Step
          <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </form>
  );
}

