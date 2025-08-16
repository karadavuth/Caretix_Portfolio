'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart';
import { ArrowLeft, Package, Truck, CreditCard, MapPin } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    shippingAddress: {
      street: '',
      houseNumber: '',
      postalCode: '',
      city: '',
      country: 'Nederland'
    },
    billingAddress: {
      street: '',
      houseNumber: '',
      postalCode: '',
      city: '',
      country: 'Nederland'
    },
    sameAsBilling: true,
    paymentMethod: 'ideal',
    idealBank: '',
    acceptTerms: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (addressType: 'shippingAddress' | 'billingAddress', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [addressType]: {
        ...prev[addressType],
        [field]: value
      }
    }));
  };

  const handleSameAsBillingToggle = () => {
    const newValue = !formData.sameAsBilling;
    setFormData(prev => ({
      ...prev,
      sameAsBilling: newValue,
      billingAddress: newValue ? { ...prev.shippingAddress } : prev.billingAddress
    }));
  };

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    
    // Simulate order processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Clear cart and redirect to success
    clearCart();
    router.push('/checkout/success');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Terug
            </button>
            <h1 className="text-2xl font-bold text-green-600">HealClinics Bestelling</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-6">Bestelgegevens</h2>
              
              {/* Step 1: Contact Info */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
                  Contact informatie
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-mailadres *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="je@email.nl"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Voor bestelbevestiging en track & trace</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefoon
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="06-12345678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Voornaam *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Achternaam *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Shipping Address */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
                  <MapPin className="h-5 w-5" />
                  Verzendadres
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Straatnaam *
                    </label>
                    <input
                      type="text"
                      value={formData.shippingAddress.street}
                      onChange={(e) => handleAddressChange('shippingAddress', 'street', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Hoofdstraat"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Huisnummer *
                    </label>
                    <input
                      type="text"
                      value={formData.shippingAddress.houseNumber}
                      onChange={(e) => handleAddressChange('shippingAddress', 'houseNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="123"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postcode *
                    </label>
                    <input
                      type="text"
                      value={formData.shippingAddress.postalCode}
                      onChange={(e) => handleAddressChange('shippingAddress', 'postalCode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="1234 AB"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plaats *
                    </label>
                    <input
                      type="text"
                      value={formData.shippingAddress.city}
                      onChange={(e) => handleAddressChange('shippingAddress', 'city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Amsterdam"
                      required
                    />
                  </div>
                </div>

                {/* ✅ BILLING ADDRESS OPTION */}
                <div className="mt-6">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.sameAsBilling}
                      onChange={handleSameAsBillingToggle}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Factuuradres is hetzelfde als verzendadres
                    </span>
                  </label>
                </div>

                {/* Billing Address (if different) */}
                {!formData.sameAsBilling && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-4">Factuuradres</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Straatnaam *
                        </label>
                        <input
                          type="text"
                          value={formData.billingAddress.street}
                          onChange={(e) => handleAddressChange('billingAddress', 'street', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Huisnummer *
                        </label>
                        <input
                          type="text"
                          value={formData.billingAddress.houseNumber}
                          onChange={(e) => handleAddressChange('billingAddress', 'houseNumber', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Postcode *
                        </label>
                        <input
                          type="text"
                          value={formData.billingAddress.postalCode}
                          onChange={(e) => handleAddressChange('billingAddress', 'postalCode', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Plaats *
                        </label>
                        <input
                          type="text"
                          value={formData.billingAddress.city}
                          onChange={(e) => handleAddressChange('billingAddress', 'city', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Payment */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm">3</span>
                  <CreditCard className="h-5 w-5" />
                  Betaalmethode
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="ideal"
                      checked={formData.paymentMethod === 'ideal'}
                      onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="font-medium">iDEAL</span>
                    <span className="text-sm text-gray-500">Betaal direct via je eigen bank</span>
                  </label>
                  
                  {formData.paymentMethod === 'ideal' && (
                    <div className="ml-7">
                      <select
                        value={formData.idealBank}
                        onChange={(e) => handleInputChange('idealBank', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      >
                        <option value="">Kies je bank</option>
                        <option value="ing">ING</option>
                        <option value="rabobank">Rabobank</option>
                        <option value="abnamro">ABN AMRO</option>
                        <option value="sns">SNS Bank</option>
                        <option value="asn">ASN Bank</option>
                        <option value="bunq">bunq</option>
                        <option value="knab">Knab</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="mb-6">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 mt-0.5"
                    required
                  />
                  <span className="text-sm text-gray-700">
                    Ik ga akkoord met de{' '}
                    <a href="#" className="text-green-600 hover:underline">algemene voorwaarden</a>
                    {' '}en{' '}
                    <a href="#" className="text-green-600 hover:underline">privacybeleid</a>
                    {' '}van HealClinics
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* ✅ Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h3 className="text-lg font-bold mb-4">Bestelsamenvatting</h3>
              
              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name_nl}
                          className="w-full h-full object-contain rounded-lg"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium line-clamp-2">{item.name_nl}</h4>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-gray-600">Aantal: {item.quantity}</span>
                        <span className="font-medium">€{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ✅ PRICING BREAKDOWN */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotaal:</span>
                  <span>€{getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Verzendkosten:</span>
                  <span className="text-green-600 font-medium">Gratis</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>BTW (21%):</span>
                  <span>Inbegrepen</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Totaal:</span>
                  <span className="text-green-600">€{getTotalPrice().toFixed(2)}</span>
                </div>
              </div>

              {/* ✅ SHIPPING INFO */}
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Gratis verzending</span>
                </div>
                <p className="text-sm text-green-700">
                  Je bestelling wordt gratis bezorgd binnen 1-3 werkdagen.
                  Alle prijzen zijn inclusief verzendkosten.
                </p>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitOrder}
                disabled={!formData.acceptTerms || !formData.email || !formData.firstName || !formData.lastName || isSubmitting}
                className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Bestelling verwerken...
                  </div>
                ) : (
                  `Bestelling plaatsen - €${getTotalPrice().toFixed(2)}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
