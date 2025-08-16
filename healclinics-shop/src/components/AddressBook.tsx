'use client';

import { useState, useEffect } from 'react';
import { authService } from '@/lib/auth';
import { 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  Home, 
  Building2,
  Check,
  X
} from 'lucide-react';

interface Address {
  id: number;
  address_type: string;
  first_name: string;
  last_name: string;
  company: string;
  street_address: string;
  house_number: string;
  house_number_addition: string;
  postal_code: string;
  city: string;
  province: string;
  country: string;
  is_default_shipping: boolean;
  is_default_billing: boolean;
  full_address: string;
  created_at: string;
}

interface AddressForm {
  address_type: 'shipping' | 'billing';
  first_name: string;
  last_name: string;
  company: string;
  street_address: string;
  house_number: string;
  house_number_addition: string;
  postal_code: string;
  city: string;
  province: string;
  country: string;
  is_default_shipping: boolean;
  is_default_billing: boolean;
}

export default function AddressBook() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addressForm, setAddressForm] = useState<AddressForm>({
    address_type: 'shipping',
    first_name: '',
    last_name: '',
    company: '',
    street_address: '',
    house_number: '',
    house_number_addition: '',
    postal_code: '',
    city: '',
    province: 'Nederland',
    country: 'Nederland',
    is_default_shipping: false,
    is_default_billing: false,
  });

  // Load addresses
  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const response = await authService.makeAuthenticatedRequest(
        'http://127.0.0.1:8080/api/addresses/',
        { method: 'GET' }
      );
      
      if (response.ok) {
        const data = await response.json();
        setAddresses(data.addresses);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      setError('Kon adressen niet laden');
    } finally {
      setLoading(false);
    }
  };

  // Validate Dutch postal code
  const validatePostalCode = (postalCode: string): boolean => {
    const pattern = /^[1-9][0-9]{3}\s?[A-Z]{2}$/;
    return pattern.test(postalCode.toUpperCase().replace(' ', ' '));
  };

  const handleSaveAddress = async () => {
    setError(null);
    setSaving(true);

    // Basic validation
    const requiredFields = ['first_name', 'last_name', 'street_address', 'house_number', 'postal_code', 'city'];
    for (const field of requiredFields) {
      if (!addressForm[field as keyof AddressForm]) {
        setError(`${field.replace('_', ' ')} is verplicht`);
        setSaving(false);
        return;
      }
    }

    // Postal code validation
    if (!validatePostalCode(addressForm.postal_code)) {
      setError('Voer een geldige Nederlandse postcode in (bijv. 1234 AB)');
      setSaving(false);
      return;
    }

    try {
      const method = editingAddress ? 'PUT' : 'POST';
      const url = editingAddress 
        ? `http://127.0.0.1:8080/api/addresses/${editingAddress.id}/`
        : 'http://127.0.0.1:8080/api/addresses/';

      const response = await authService.makeAuthenticatedRequest(url, {
        method,
        body: JSON.stringify(addressForm),
      });

      if (response.ok) {
        await loadAddresses(); // Reload addresses
        resetForm();
        setShowForm(false);
        setEditingAddress(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Fout bij het opslaan van adres');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      setError('Kon adres niet opslaan');
    } finally {
      setSaving(false);
    }
  };

  const handleEditAddress = (address: Address) => {
    setAddressForm({
      address_type: address.address_type as 'shipping' | 'billing',
      first_name: address.first_name,
      last_name: address.last_name,
      company: address.company,
      street_address: address.street_address,
      house_number: address.house_number,
      house_number_addition: address.house_number_addition,
      postal_code: address.postal_code,
      city: address.city,
      province: address.province,
      country: address.country,
      is_default_shipping: address.is_default_shipping,
      is_default_billing: address.is_default_billing,
    });
    setEditingAddress(address);
    setShowForm(true);
  };

  const handleDeleteAddress = async (address: Address) => {
    const confirmed = window.confirm(
      `Weet je zeker dat je dit adres wilt verwijderen?\n\n${address.full_address}`
    );

    if (confirmed) {
      try {
        const response = await authService.makeAuthenticatedRequest(
          `http://127.0.0.1:8080/api/addresses/${address.id}/`,
          { method: 'DELETE' }
        );

        if (response.ok) {
          await loadAddresses();
        } else {
          setError('Kon adres niet verwijderen');
        }
      } catch (error) {
        console.error('Error deleting address:', error);
        setError('Kon adres niet verwijderen');
      }
    }
  };

  const resetForm = () => {
    setAddressForm({
      address_type: 'shipping',
      first_name: '',
      last_name: '',
      company: '',
      street_address: '',
      house_number: '',
      house_number_addition: '',
      postal_code: '',
      city: '',
      province: 'Nederland',
      country: 'Nederland',
      is_default_shipping: false,
      is_default_billing: false,
    });
    setError(null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3">Adressen laden...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Adresboek</h2>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nieuw Adres
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Address List */}
        {addresses.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Geen adressen opgeslagen
            </h3>
            <p className="text-gray-600 mb-6">
              Voeg je verzend- en factuuradres toe voor snellere checkout
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="btn-primary"
            >
              Eerste adres toevoegen
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="border border-gray-200 rounded-lg p-6 hover:border-green-300 transition-colors"
              >
                {/* Address Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {address.address_type === 'shipping' ? (
                      <Home className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Building2 className="h-5 w-5 text-purple-600" />
                    )}
                    <span className="font-semibold">
                      {address.address_type === 'shipping' ? 'Verzendadres' : 'Factuuradres'}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditAddress(address)}
                      className="text-gray-400 hover:text-green-600 transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(address)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Address Content */}
                <div className="space-y-1 text-sm text-gray-700 mb-4">
                  <div className="font-medium">
                    {address.first_name} {address.last_name}
                  </div>
                  {address.company && (
                    <div className="text-gray-600">{address.company}</div>
                  )}
                  <div>
                    {address.street_address} {address.house_number}
                    {address.house_number_addition && ` ${address.house_number_addition}`}
                  </div>
                  <div>{address.postal_code} {address.city}</div>
                  {address.country !== 'Nederland' && (
                    <div>{address.country}</div>
                  )}
                </div>

                {/* Default Markers */}
                <div className="flex gap-2">
                  {address.is_default_shipping && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      <Home className="h-3 w-3 mr-1" />
                      Standaard verzending
                    </span>
                  )}
                  {address.is_default_billing && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                      <Building2 className="h-3 w-3 mr-1" />
                      Standaard factuur
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Address Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">
              {editingAddress ? 'Adres Bewerken' : 'Nieuw Adres Toevoegen'}
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingAddress(null);
                resetForm();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Address Type */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adres Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={addressForm.address_type === 'shipping'}
                    onChange={() => setAddressForm({ ...addressForm, address_type: 'shipping' })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <Home className="h-4 w-4 ml-2 mr-1 text-blue-600" />
                  <span className="ml-1">Verzendadres</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={addressForm.address_type === 'billing'}
                    onChange={() => setAddressForm({ ...addressForm, address_type: 'billing' })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <Building2 className="h-4 w-4 ml-2 mr-1 text-purple-600" />
                  <span className="ml-1">Factuuradres</span>
                </label>
              </div>
            </div>

            {/* Name Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voornaam *
              </label>
              <input
                type="text"
                value={addressForm.first_name}
                onChange={(e) => setAddressForm({ ...addressForm, first_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Voornaam"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Achternaam *
              </label>
              <input
                type="text"
                value={addressForm.last_name}
                onChange={(e) => setAddressForm({ ...addressForm, last_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Achternaam"
              />
            </div>

            {/* Company */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bedrijf (optioneel)
              </label>
              <input
                type="text"
                value={addressForm.company}
                onChange={(e) => setAddressForm({ ...addressForm, company: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Bedrijfsnaam"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Straatnaam *
              </label>
              <input
                type="text"
                value={addressForm.street_address}
                onChange={(e) => setAddressForm({ ...addressForm, street_address: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Straatnaam"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Huisnummer *
                </label>
                <input
                  type="text"
                  value={addressForm.house_number}
                  onChange={(e) => setAddressForm({ ...addressForm, house_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Toevoeging
                </label>
                <input
                  type="text"
                  value={addressForm.house_number_addition}
                  onChange={(e) => setAddressForm({ ...addressForm, house_number_addition: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="A"
                />
              </div>
            </div>

            {/* Postal Code & City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postcode *
              </label>
              <input
                type="text"
                value={addressForm.postal_code}
                onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="1234 AB"
                maxLength={7}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plaats *
              </label>
              <input
                type="text"
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Amsterdam"
              />
            </div>

            {/* Default Settings */}
            <div className="md:col-span-2 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addressForm.is_default_shipping}
                  onChange={(e) => setAddressForm({ ...addressForm, is_default_shipping: e.target.checked })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Instellen als standaard verzendadres
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addressForm.is_default_billing}
                  onChange={(e) => setAddressForm({ ...addressForm, is_default_billing: e.target.checked })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Instellen als standaard factuuradres
                </span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleSaveAddress}
              disabled={saving}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                saving
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <Check className="h-4 w-4" />
              {saving ? 'Opslaan...' : editingAddress ? 'Bijwerken' : 'Opslaan'}
            </button>
            
            <button
              onClick={() => {
                setShowForm(false);
                setEditingAddress(null);
                resetForm();
              }}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
