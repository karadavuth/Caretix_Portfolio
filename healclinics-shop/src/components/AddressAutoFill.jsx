import { useState, useEffect } from 'react';
import { useAddress } from '@/hooks/useAddress';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function AddressAutoFill({ 
  onAddressFound, 
  initialPostcode = '', 
  initialHouseNumber = '',
  className = '' 
}) {
  const [postcode, setPostcode] = useState(initialPostcode);
  const [houseNumber, setHouseNumber] = useState(initialHouseNumber);
  const [houseAddition, setHouseAddition] = useState('');
  const [foundAddress, setFoundAddress] = useState(null);
  
  const { lookupAddress, validatePostcode, formatPostcode, isLoading, error } = useAddress();

  // Auto-lookup when both postcode and house number are filled
  useEffect(() => {
    const doLookup = async () => {
      if (postcode.length >= 6 && houseNumber.trim()) {
        const result = await lookupAddress(postcode, houseNumber);
        
        if (result.success) {
          setFoundAddress(result.address);
          onAddressFound(result.address);
        } else {
          setFoundAddress(null);
        }
      }
    };

    const timeout = setTimeout(doLookup, 500); // Debounce
    return () => clearTimeout(timeout);
  }, [postcode, houseNumber, lookupAddress, onAddressFound]);

  const handlePostcodeChange = (e) => {
    const value = e.target.value.toUpperCase();
    setPostcode(value);
    setFoundAddress(null);
  };

  const handleHouseNumberChange = (e) => {
    setHouseNumber(e.target.value);
    setFoundAddress(null);
  };

  const getPostcodeStatus = () => {
    if (!postcode) return null;
    if (isLoading) return 'loading';
    if (validatePostcode(postcode)) {
      return foundAddress ? 'success' : 'checking';
    }
    return 'error';
  };

  const status = getPostcodeStatus();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Postcode & House Number Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Postcode *
          </label>
          <div className="relative">
            <input
              type="text"
              value={postcode}
              onChange={handlePostcodeChange}
              placeholder="1234 AB"
              maxLength={7}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                status === 'error' ? 'border-red-500' : 
                status === 'success' ? 'border-green-500' : 'border-gray-300'
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {status === 'loading' && (
                <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
              )}
              {status === 'success' && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {status === 'error' && (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
          {!validatePostcode(postcode) && postcode.length > 0 && (
            <p className="text-red-500 text-sm mt-1">
              Gebruik format: 1234 AB
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Huisnummer *
          </label>
          <input
            type="text"
            value={houseNumber}
            onChange={handleHouseNumberChange}
            placeholder="123"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* House Addition */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Toevoeging (optioneel)
          </label>
          <input
            type="text"
            value={houseAddition}
            onChange={(e) => setHouseAddition(e.target.value)}
            placeholder="A, bis, etc."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Found Address Display */}
      {foundAddress && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-green-800 mb-1">Adres gevonden:</h4>
              <p className="text-green-700">
                {foundAddress.street} {foundAddress.houseNumber}
                {houseAddition && ` ${houseAddition}`}
              </p>
              <p className="text-green-700">
                {foundAddress.postalCode} {foundAddress.city}
              </p>
              <p className="text-sm text-green-600">
                {foundAddress.province}, {foundAddress.country}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-800 mb-1">Fout bij adres opzoeken:</h4>
              <p className="text-red-700 text-sm">{error}</p>
              <p className="text-red-600 text-sm mt-1">
                Controleer je postcode en huisnummer en probeer het opnieuw.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
