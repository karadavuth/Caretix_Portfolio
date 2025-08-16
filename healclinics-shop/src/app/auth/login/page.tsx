'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple login logic without complex hooks
    console.log('Login attempted:', { email, password });
    // For now, just redirect to home
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center text-gray-600 hover:text-green-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Terug naar home
        </button>

        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Inloggen</h2>
          <p className="mt-2 text-gray-600">Welkom terug bij HealClinics</p>
        </div>

        {/* Simple Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              E-mailadres
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="je@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Wachtwoord
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="Je wachtwoord"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
          >
            Inloggen
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Nog geen account?{' '}
              <button
                type="button"
                onClick={() => router.push('/auth/register')}
                className="text-green-600 hover:text-green-500"
              >
                Registreer hier
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
