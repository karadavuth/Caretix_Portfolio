'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle, Mail, Package, ArrowRight } from 'lucide-react';

export default function CheckoutSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Bestelling bevestigd!
        </h1>
        
        <p className="text-gray-600 mb-8">
          Bedankt voor je bestelling bij HealClinics. 
          Je ontvangt binnen enkele minuten een bevestigingsmail met orderdetails en track & trace informatie.
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-5 w-5 text-green-600" />
            <span>Bevestigingsmail verzonden</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Package className="h-5 w-5 text-green-600" />
            <span>Bezorging binnen 1-3 werkdagen</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/')}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Verder winkelen
          </button>
          
          <button
            onClick={() => router.push('/contact')}
            className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            Contact opnemen
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
