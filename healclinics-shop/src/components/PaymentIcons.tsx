'use client';

export default function PaymentIcons() {
  return (
    <footer className="bg-gray-50 py-16">
      <div className="container-healclinics">
        <div className="text-center mb-8">
          <h4 className="text-lg font-semibold mb-4">Geaccepteerde Betaalmethoden</h4>
          <p className="text-gray-600 text-sm">Veilig en betrouwbaar betalen</p>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-8">
          {/* iDEAL */}
          <div className="payment-icons">
            <div className="bg-white p-4 rounded-lg shadow-sm border w-20 h-12 flex items-center justify-center">
              <span className="text-xs font-bold text-purple-600">iDEAL</span>
            </div>
          </div>

          {/* Visa */}
          <div className="payment-icons">
            <div className="bg-white p-4 rounded-lg shadow-sm border w-20 h-12 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-600">VISA</span>
            </div>
          </div>

          {/* Google Pay */}
          <div className="payment-icons">
            <div className="bg-white p-4 rounded-lg shadow-sm border w-20 h-12 flex items-center justify-center">
              <span className="text-xs font-bold text-green-600">G Pay</span>
            </div>
          </div>

          {/* Apple Pay */}
          <div className="payment-icons">
            <div className="bg-white p-4 rounded-lg shadow-sm border w-20 h-12 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-800">🍎 Pay</span>
            </div>
          </div>

          {/* PayPal */}
          <div className="payment-icons">
            <div className="bg-white p-4 rounded-lg shadow-sm border w-20 h-12 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-500">PayPal</span>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            Alle betalingen worden veilig verwerkt via SSL-encryptie
          </p>
        </div>
      </div>
    </footer>
  );
}
