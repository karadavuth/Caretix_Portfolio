'use client';

import { useState } from 'react';

// TypeScript interfaces
interface PaymentMethod {
  id: string;
  name: string;
  type: 'ideal' | 'card' | 'digital_wallet';
  icon: string;
  description: string;
}

interface PaymentMethodsProps {
  onPaymentSelect: (method: string) => void;
}

// Payment methods data
const paymentMethods: PaymentMethod[] = [
  {
    id: 'ideal',
    name: 'iDEAL',
    type: 'ideal',
    icon: '🏦',
    description: 'Betaal direct via je bank'
  },
  {
    id: 'visa',
    name: 'Visa',
    type: 'card',
    icon: '💳',
    description: 'Creditcard betaling'
  },
  {
    id: 'google_pay',
    name: 'Google Pay',
    type: 'digital_wallet',
    icon: '📱',
    description: 'Betaal met Google Pay'
  },
  {
    id: 'apple_pay',
    name: 'Apple Pay',
    type: 'digital_wallet',
    icon: '🍎',
    description: 'Betaal met Apple Pay'
  }
];

export default function PaymentMethods({ onPaymentSelect }: PaymentMethodsProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('ideal');

  const handlePaymentChange = (methodId: string) => {
    setSelectedMethod(methodId);
    onPaymentSelect(methodId);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Betaalmethode</h3>
      
      <div className="grid gap-3">
        {paymentMethods.map((method: PaymentMethod) => (
          <label
            key={method.id}
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedMethod === method.id
                ? 'border-black bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="payment-method"
              value={method.id}
              checked={selectedMethod === method.id}
              onChange={(e) => handlePaymentChange(e.target.value)}
              className="sr-only"
            />
            
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <span className="text-2xl" role="img" aria-label={method.name}>
                  {method.icon}
                </span>
                <div>
                  <p className="font-medium">{method.name}</p>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
              </div>
              
              <div className={`w-4 h-4 border-2 rounded-full transition-colors ${
                selectedMethod === method.id
                  ? 'border-black bg-black'
                  : 'border-gray-300'
              }`}>
                {selectedMethod === method.id && (
                  <div className="w-2 h-2 bg-white rounded-full mx-auto mt-[2px]" />
                )}
              </div>
            </div>
          </label>
        ))}
      </div>

      {/* Payment Processing Notice */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <p className="text-sm text-green-800">
          <span className="mr-2" role="img" aria-label="secure">🔒</span>
          Alle betalingen worden veilig verwerkt via SSL-encryptie
        </p>
      </div>
    </div>
  );
}
