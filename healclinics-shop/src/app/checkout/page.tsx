'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart';
import { ArrowLeft, MapPin, Loader2, CheckCircle } from 'lucide-react';
import { useAddress } from '@/hooks/useAddress';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    houseNumber: '',
    houseAddition: '',
    postalCode: '',
    city: '',
    phone: '',
    country: 'Nederland',
    paymentMethod: 'ideal',
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
    cardHolder: '',
    sameAsBilling: true
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAddressAutoFilled, setIsAddressAutoFilled] = useState({
    address: false,
    postalCode: false,
    city: false,
    houseNumber: false
  });

  const { lookupAddress, suggestAddresses, validatePostcode, isLoading, error } = useAddress();

  // FIXED: Address suggestions useEffect - removed unstable function from deps
  useEffect(() => {
    if (!isAddressAutoFilled.address && formData.address.length >= 3) {
      const timeout = setTimeout(async () => {
        const result = await suggestAddresses(formData.address);
        if (result.success && result.suggestions.length > 0) {
          setAddressSuggestions(result.suggestions);
          setShowSuggestions(true);
        } else {
          setAddressSuggestions([]);
          setShowSuggestions(false);
        }
      }, 300);

      return () => clearTimeout(timeout);
    } else {
      // Clear suggestions when input is too short or auto-filled
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  }, [formData.address, isAddressAutoFilled.address]); // ✅ REMOVED suggestAddresses from deps

  // FIXED: Auto-lookup useEffect - removed unstable function from deps  
  useEffect(() => {
    if (formData.postalCode && formData.houseNumber && !isAddressAutoFilled.address) {
      const timeout = setTimeout(async () => {
        if (formData.postalCode.length >= 6 && formData.houseNumber.trim()) {
          const result = await lookupAddress(formData.postalCode, formData.houseNumber);
          
          if (result.success) {
            setFormData(prev => ({
              ...prev,
              address: result.address.street,
              city: result.address.city,
              postalCode: result.address.postalCode
            }));
            
            setIsAddressAutoFilled({
              address: true,
              postalCode: true,
              city: true,
              houseNumber: false
            });
            
            setFormErrors(prev => ({
              ...prev,
              address: '',
              city: '',
              postalCode: ''
            }));
          }
        }
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [formData.postalCode, formData.houseNumber, isAddressAutoFilled.address]); // ✅ REMOVED lookupAddress from deps

  // ENHANCED: Click outside to close dropdown with better targeting
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside the entire autocomplete container
      const container = event.target.closest('.address-autocomplete-container');
      const dropdown = event.target.closest('.suggestions-dropdown');
      
      // Close if clicked outside both container and dropdown
      if (!container && !dropdown) {
        setShowSuggestions(false);
        setAddressSuggestions([]);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePostalCode = (postalCode) => {
    const re = /^[1-9][0-9]{3}\s?[a-zA-Z]{2}$/;
    return re.test(postalCode);
  };

  const validateCardNumber = (cardNumber) => {
    const re = /^[0-9\s]{13,19}$/;
    return re.test(cardNumber.replace(/\s/g, ''));
  };

  const validateCardExpiry = (expiry) => {
    const re = /^(0[1-9]|1[0-2])\/[0-9]{2}$/;
    return re.test(expiry);
  };

  const validateCVC = (cvc) => {
    const re = /^[0-9]{3,4}$/;
    return re.test(cvc);
  };

  // ENHANCED: Input change handler with better auto-fill management
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Reset auto-fill status when user manually changes fields
    if (isAddressAutoFilled[field]) {
      setIsAddressAutoFilled(prev => ({
        ...prev,
        [field]: false
      }));
      
      // If user manually edits address, allow suggestions again
      if (field === 'address') {
        setShowSuggestions(false);
        setAddressSuggestions([]);
      }
    }

    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // ENHANCED: Address selection with complete dropdown closure
  const handleAddressSelect = (suggestion) => {
    // Update form data
    setFormData(prev => ({
      ...prev,
      address: suggestion.street,
      houseNumber: suggestion.house_number,
      postalCode: suggestion.postal_code,
      city: suggestion.city
    }));

    // Mark fields as auto-filled
    setIsAddressAutoFilled({
      address: true,
      postalCode: true,
      city: true,
      houseNumber: true
    });

    // CRITICAL: Completely close and reset dropdown
    setShowSuggestions(false);
    setAddressSuggestions([]);

    // Clear any errors
    setFormErrors(prev => ({
      ...prev,
      address: '',
      houseNumber: '',
      postalCode: '',
      city: ''
    }));

    // EXTRA: Force blur the input to prevent refocus issues
    setTimeout(() => {
      const addressInput = document.querySelector('input[placeholder*="Begin met typen"]');
      if (addressInput) {
        addressInput.blur();
      }
    }, 100);
  };

  const handlePostalCodeChange = (value) => {
    let formatted = value.toUpperCase().replace(/\s/g, '');
    if (formatted.length > 4) {
      formatted = formatted.substring(0, 4) + ' ' + formatted.substring(4, 6);
    }
    handleInputChange('postalCode', formatted);
  };

  const handleCardNumberChange = (value) => {
    const formatted = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
    handleInputChange('cardNumber', formatted);
  };

  const handleCardExpiryChange = (value) => {
    let formatted = value.replace(/\D/g, '');
    if (formatted.length >= 2) {
      formatted = formatted.substring(0, 2) + '/' + formatted.substring(2, 4);
    }
    handleInputChange('cardExpiry', formatted);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email) {
      errors.email = 'E-mailadres is verplicht';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Vul een geldig e-mailadres in';
    }

    if (!formData.firstName) {
      errors.firstName = 'Voornaam is verplicht';
    }

    if (!formData.lastName) {
      errors.lastName = 'Achternaam is verplicht';
    }

    if (!formData.address) {
      errors.address = 'Adres is verplicht';
    }

    if (!formData.houseNumber) {
      errors.houseNumber = 'Huisnummer is verplicht';
    }

    if (!formData.postalCode) {
      errors.postalCode = 'Postcode is verplicht';
    } else if (!validatePostalCode(formData.postalCode)) {
      errors.postalCode = 'Vul een geldige Nederlandse postcode in (bijv. 1234 AB)';
    }

    if (!formData.city) {
      errors.city = 'Plaats is verplicht';
    }

    if (formData.paymentMethod === 'creditcard') {
      if (!formData.cardNumber) {
        errors.cardNumber = 'Kaartnummer is verplicht';
      } else if (!validateCardNumber(formData.cardNumber)) {
        errors.cardNumber = 'Vul een geldig kaartnummer in';
      }

      if (!formData.cardExpiry) {
        errors.cardExpiry = 'Vervaldatum is verplicht';
      } else if (!validateCardExpiry(formData.cardExpiry)) {
        errors.cardExpiry = 'Vul een geldige vervaldatum in (MM/YY)';
      }

      if (!formData.cardCVC) {
        errors.cardCVC = 'Beveiligingscode is verplicht';
      } else if (!validateCVC(formData.cardCVC)) {
        errors.cardCVC = 'Vul een geldige beveiligingscode in';
      }

      if (!formData.cardHolder) {
        errors.cardHolder = 'Naam op kaart is verplicht';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitOrder = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      clearCart();
      router.push('/checkout/success');
    } catch (error) {
      console.error('Order submission error:', error);
      setFormErrors({ submit: 'Er ging iets mis bij het verwerken van je bestelling. Probeer het opnieuw.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Winkelwagen is leeg</h1>
          <p className="text-gray-600 mb-6">Voeg eerst producten toe aan je winkelwagen</p>
          <button
            onClick={() => router.push('/')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Naar Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Terug
          </button>
          <h1 className="text-xl font-bold text-green-600">HealClinics</h1>
          <a href="/auth/login" className="text-green-600 underline ml-auto hover:text-green-700">
            Inloggen
          </a>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* LEFT COLUMN: Form */}
          <div className="space-y-8">
            
            {/* Contact Section */}
            <div>
              <h2 className="text-xl font-bold mb-4">CONTACT</h2>
              <div>
                <input
                  type="email"
                  placeholder="E-mail"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full border rounded-md px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    formErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                )}
              </div>
            </div>

            {/* Delivery Address Section */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                BEZORGING
              </h2>
              
              <select 
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-base mb-6 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="Nederland">Nederland</option>
              </select>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <input
                    type="text"
                    placeholder="Voornaam"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`border rounded-md px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent w-full ${
                      formErrors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {formErrors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Achternaam"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`border rounded-md px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent w-full ${
                      formErrors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {formErrors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Address Fields with Enhanced Autocomplete */}
              <div className="space-y-4">
                {/* ENHANCED: Street Address with Suggestions */}
                <div className="relative address-autocomplete-container">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Straatnaam *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Begin met typen voor suggesties..."
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      onFocus={() => {
                        // Only show suggestions if we have them and address is not auto-filled
                        if (addressSuggestions.length > 0 && !isAddressAutoFilled.address) {
                          setShowSuggestions(true);
                        }
                      }}
                      onBlur={(e) => {
                        // ENHANCED: Delay hiding to allow for clicks on suggestions
                        setTimeout(() => {
                          // Only hide if not clicking on a suggestion
                          if (!e.relatedTarget?.closest('.suggestions-dropdown')) {
                            setShowSuggestions(false);
                          }
                        }, 150);
                      }}
                      className={`w-full border rounded-md px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        isAddressAutoFilled.address ? 'bg-gray-100' : ''
                      } ${formErrors.address ? 'border-red-500' : 'border-gray-300'}`}
                      required
                    />
                    {isLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                      </div>
                    )}
                    {isAddressAutoFilled.address && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                    )}
                  </div>
                  
                  {/* ENHANCED: Suggestions Dropdown with better class and event handling */}
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div className="suggestions-dropdown absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {addressSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-blue-50 focus:outline-none"
                          onMouseDown={(e) => {
                            // Prevent blur event from firing before click
                            e.preventDefault();
                          }}
                          onClick={() => handleAddressSelect(suggestion)}
                        >
                          <div className="font-medium">{suggestion.formatted_address}</div>
                          <div className="text-sm text-gray-500">
                            {suggestion.postal_code} {suggestion.city}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {formErrors.address && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.address}</p>
                  )}
                </div>

                {/* House Number and Addition */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Huisnummer *
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      value={formData.houseNumber}
                      onChange={(e) => handleInputChange('houseNumber', e.target.value)}
                      className={`w-full border rounded-md px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        isAddressAutoFilled.houseNumber ? 'bg-gray-100' : ''
                      } ${formErrors.houseNumber ? 'border-red-500' : 'border-gray-300'}`}
                      required
                    />
                    {formErrors.houseNumber && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.houseNumber}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Toevoeging
                    </label>
                    <input
                      type="text"
                      placeholder="A, bis"
                      value={formData.houseAddition}
                      onChange={(e) => handleInputChange('houseAddition', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Postbusnr., enz. (optioneel)"
                  className="w-full border border-gray-300 rounded-md px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />

                {/* Postcode and City */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postcode *
                    </label>
                    <input
                      type="text"
                      placeholder="1234 AB"
                      value={formData.postalCode}
                      onChange={(e) => handlePostalCodeChange(e.target.value)}
                      className={`w-full border rounded-md px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        isAddressAutoFilled.postalCode ? 'bg-gray-100' : ''
                      } ${formErrors.postalCode ? 'border-red-500' : 'border-gray-300'}`}
                      maxLength={7}
                      required
                    />
                    {formErrors.postalCode && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.postalCode}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stad *
                    </label>
                    <input
                      type="text"
                      placeholder="Amsterdam"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={`w-full border rounded-md px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        isAddressAutoFilled.city ? 'bg-gray-100' : ''
                      } ${formErrors.city ? 'border-red-500' : 'border-gray-300'}`}
                      required
                    />
                    {formErrors.city && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.city}</p>
                    )}
                  </div>
                </div>
              </div>

              <input
                type="tel"
                placeholder="Telefoon (optioneel)"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-base mt-4 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />

              <div className="flex items-center gap-2 text-sm mt-4">
                <input type="checkbox" className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500" />
                <span>Deze informatie opslaan om in het vervolg sneller af te rekenen</span>
              </div>

              {/* Enhanced Verzendwijze Section */}
              <div className="mt-6">
                <h3 className="font-bold mb-4">VERZENDWIJZE</h3>
                
                {/* Pre-selected shipping option with gray background */}
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                  <label className="flex items-center gap-3 cursor-default">
                    <input
                      type="radio"
                      name="shipping"
                      value="standard"
                      checked={true}
                      readOnly
                      disabled
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 cursor-not-allowed opacity-75"
                    />
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-gray-700">
                        Standaard (1-3 Werkdagen)
                      </span>
                      <span className="font-semibold text-green-600">
                        Gratis
                      </span>
                    </div>
                  </label>
                  <p className="text-sm text-gray-600 mt-2 ml-7">
                    Gratis verzending voor alle bestellingen binnen Nederland
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div>
              <h2 className="text-xl font-bold mb-4">BETALING</h2>
              <p className="text-sm text-gray-600 mb-6">Alle transacties zijn beveiligd en versleuteld.</p>
              
              <div className="space-y-3">
                {/* Credit Card Option */}
                <label className={`flex items-center gap-3 p-4 border rounded-md cursor-pointer hover:bg-gray-50 ${
                  formData.paymentMethod === 'creditcard' ? 'border-2 border-green-600 bg-green-50' : 'border border-gray-300'
                }`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="creditcard"
                    className="w-4 h-4 text-green-600"
                    checked={formData.paymentMethod === 'creditcard'}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  />
                  <span className="font-medium">Creditcard</span>
                  <div className="ml-auto flex gap-1 text-xs">
                    <span className="text-blue-600 font-bold">VISA</span>
                    <span className="text-red-600 font-bold">MC</span>
                    <span className="text-blue-500 font-bold">AMEX</span>
                    <span>+2</span>
                  </div>
                </label>

                {/* Credit Card Fields */}
                {formData.paymentMethod === 'creditcard' && (
                  <div className="ml-7 space-y-3 bg-gray-50 p-4 rounded-md">
                    <div>
                      <input
                        type="text"
                        placeholder="Kaartnummer"
                        value={formData.cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        className={`w-full border rounded-md px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          formErrors.cardNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        maxLength={19}
                        required={formData.paymentMethod === 'creditcard'}
                      />
                      {formErrors.cardNumber && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.cardNumber}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="text"
                          placeholder="Vervaldatum (MM/YY)"
                          value={formData.cardExpiry}
                          onChange={(e) => handleCardExpiryChange(e.target.value)}
                          className={`w-full border rounded-md px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            formErrors.cardExpiry ? 'border-red-500' : 'border-gray-300'
                          }`}
                          maxLength={5}
                          required={formData.paymentMethod === 'creditcard'}
                        />
                        {formErrors.cardExpiry && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.cardExpiry}</p>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Beveiligingscode"
                          value={formData.cardCVC}
                          onChange={(e) => handleInputChange('cardCVC', e.target.value.replace(/\D/g, ''))}
                          className={`w-full border rounded-md px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            formErrors.cardCVC ? 'border-red-500' : 'border-gray-300'
                          }`}
                          maxLength={4}
                          required={formData.paymentMethod === 'creditcard'}
                        />
                        {formErrors.cardCVC && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.cardCVC}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Naam op kaart"
                        value={formData.cardHolder}
                        onChange={(e) => handleInputChange('cardHolder', e.target.value)}
                        className={`w-full border rounded-md px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          formErrors.cardHolder ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required={formData.paymentMethod === 'creditcard'}
                      />
                      {formErrors.cardHolder && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.cardHolder}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500" />
                      <span>Bezorgadres en factuuradres zijn hetzelfde</span>
                    </div>
                  </div>
                )}
                
                {/* PayPal Option */}
                <label className={`flex items-center gap-3 p-4 border rounded-md cursor-pointer hover:bg-gray-50 ${
                  formData.paymentMethod === 'paypal' ? 'border-2 border-green-600 bg-green-50' : 'border border-gray-300'
                }`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="paypal"
                    className="w-4 h-4 text-green-600"
                    checked={formData.paymentMethod === 'paypal'}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  />
                  <span className="font-medium">PayPal</span>
                  <span className="ml-auto text-blue-600 font-bold text-sm">PayPal</span>
                </label>
                
                {/* iDEAL Option */}
                <label className={`flex items-center gap-3 p-4 border rounded-md cursor-pointer hover:bg-gray-50 ${
                  formData.paymentMethod === 'ideal' ? 'border-2 border-green-600 bg-green-50' : 'border border-gray-300'
                }`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="ideal"
                    className="w-4 h-4 text-green-600"
                    checked={formData.paymentMethod === 'ideal'}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  />
                  <span className="font-medium">iDEAL</span>
                  <span className="ml-auto text-orange-600 font-bold text-sm">iDEAL</span>
                </label>
              </div>

              {formData.paymentMethod === 'ideal' && (
                <div className="mt-6 p-4 bg-gray-50 rounded-md text-center">
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-8">
                    <div className="w-16 h-10 border border-gray-300 rounded mx-auto mb-4 bg-white flex items-center justify-center">
                      <span className="text-xs text-gray-500">→</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Nadat je op "Nu betalen" hebt geklikt, word je doorgestuurd naar iDeal om je aankoop veilig te voltooien.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Billing Address Section */}
            <div>
              <h2 className="text-xl font-bold mb-4">FACTUURADRES</h2>
              <label className={`flex items-center gap-3 p-4 border rounded-md cursor-pointer mb-3 ${
                formData.sameAsBilling ? 'border-2 border-green-600 bg-green-50' : 'border border-gray-300'
              }`}>
                <input 
                  type="radio" 
                  name="billing" 
                  className="w-4 h-4 text-green-600" 
                  checked={formData.sameAsBilling}
                  onChange={() => handleInputChange('sameAsBilling', true)}
                />
                <span className="font-medium">Zelfde als bezorgadres</span>
              </label>
              
              <label className={`flex items-center gap-3 p-4 border rounded-md cursor-pointer ${
                !formData.sameAsBilling ? 'border-2 border-green-600 bg-green-50' : 'border border-gray-300'
              }`}>
                <input 
                  type="radio" 
                  name="billing" 
                  className="w-4 h-4 text-green-600"
                  checked={!formData.sameAsBilling}
                  onChange={() => handleInputChange('sameAsBilling', false)}
                />
                <span>Een ander factuuradres gebruiken</span>
              </label>
              
              {formErrors.submit && (
                <p className="text-red-500 text-sm mt-4">{formErrors.submit}</p>
              )}
              
              <p className="text-sm text-gray-600 mt-6">
                Door je bestelling te plaatsen ga je akkoord met de <a href="#" className="text-green-600 underline hover:text-green-700">Algemene Voorwaarden</a> en <a href="#" className="text-green-600 underline hover:text-green-700">Privacybeleid</a> van HealClinics.
              </p>
              
              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="w-full mt-6 bg-green-600 text-white py-4 rounded-md text-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Verwerken...' : 'NU BETALEN'}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary */}
          <div className="lg:pl-8">
            <div className="bg-gray-50 p-6 rounded-lg sticky top-6">
              <h3 className="text-lg font-bold mb-6">Bestelsamenvatting</h3>
              
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 pb-4 border-b border-gray-200">
                    <div className="relative">
                      <img
                        src={item.image_url || '/placeholder-product.jpg'}
                        alt={item.name_nl}
                        className="w-16 h-16 object-cover rounded-lg bg-white"
                      />
                      <span className="absolute -top-2 -right-2 bg-gray-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name_nl}</h4>
                      <p className="text-gray-500 text-sm">Standaard maat</p>
                    </div>
                    <span className="font-medium text-gray-900">
                      €{(item.price * item.quantity).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-gray-900">
                  <span>Subtotaal · {items.length} artikel{items.length !== 1 ? 'en' : ''}</span>
                  <span>€{getTotalPrice().toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-gray-900">
                  <span>Verzending</span>
                  <span className="text-green-600 font-medium">Gratis</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-200">
                  <span>Totaal</span>
                  <span className="text-green-600">
                    <span className="text-sm text-gray-500 mr-2">EUR</span>
                    €{getTotalPrice().toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Inclusief €{(getTotalPrice() * 0.21).toFixed(2).replace('.', ',')} btw
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <footer className="border-t mt-12 py-6 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-green-600 underline hover:text-green-700">Terugbetalingsbeleid</a>
            <a href="#" className="text-green-600 underline hover:text-green-700">Privacybeleid</a>
            <a href="#" className="text-green-600 underline hover:text-green-700">Algemene voorwaarden</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
