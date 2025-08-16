'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, Phone, Check, X } from 'lucide-react';
import { authService } from '@/lib/auth';

interface FormData {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  password: string;
  password_confirm: string;
  agree_terms: boolean;
  newsletter: boolean;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  color: string;
}

interface ValidationState {
  email: { touched: boolean; valid: boolean };
  phone: { touched: boolean; valid: boolean };
}

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    password_confirm: '',
    agree_terms: false,
    newsletter: true,
  });

  // Validation state - track welke velden zijn "touched" (verlaten)
  const [validation, setValidation] = useState<ValidationState>({
    email: { touched: false, valid: true },
    phone: { touched: false, valid: true },
  });

  // Nederlandse wachtwoord sterkte checker
  const checkPasswordStrength = (password: string): PasswordStrength => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;
    const feedback: string[] = [];

    if (!checks.length) feedback.push('Minimaal 8 tekens');
    if (!checks.uppercase) feedback.push('Een hoofdletter');
    if (!checks.lowercase) feedback.push('Een kleine letter');
    if (!checks.number) feedback.push('Een cijfer');
    if (!checks.special) feedback.push('Een speciaal teken');

    const colors = ['bg-red-500', 'bg-red-400', 'bg-yellow-500', 'bg-yellow-400', 'bg-green-500'];

    return {
      score,
      feedback,
      color: colors[score - 1] || 'bg-gray-300',
    };
  };

  const passwordStrength = checkPasswordStrength(formData.password);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    // Nederlandse telefoonnummer validatie (06 of 0XX-XXXXXXX)
    const phoneRegex = /^(06|0[1-9][0-9])-?[0-9]{7,8}$/;
    return phoneRegex.test(phone.replace(/\s/g, '')) || phone === '';
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  // Handle field blur (wanneer gebruiker veld verlaat)
  const handleFieldBlur = (field: 'email' | 'phone') => {
    let isValid = true;
    
    if (field === 'email') {
      isValid = validateEmail(formData.email);
    } else if (field === 'phone') {
      isValid = validatePhone(formData.phone);
    }

    setValidation(prev => ({
      ...prev,
      [field]: { touched: true, valid: isValid }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Final validatie voor submit
    if (!validateEmail(formData.email)) {
      setError('Voer een geldig e-mailadres in');
      setLoading(false);
      return;
    }

    if (!validatePhone(formData.phone) && formData.phone !== '') {
      setError('Voer een geldig Nederlands telefoonnummer in (bijv. 06-12345678)');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.password_confirm) {
      setError('Wachtwoorden komen niet overeen');
      setLoading(false);
      return;
    }

    if (passwordStrength.score < 3) {
      setError('Wachtwoord is te zwak. Gebruik minimaal 8 tekens met hoofdletters, kleine letters, cijfers en speciale tekens.');
      setLoading(false);
      return;
    }

    if (!formData.agree_terms) {
      setError('Je moet akkoord gaan met de algemene voorwaarden');
      setLoading(false);
      return;
    }

    try {
      const response = await authService.register({
        username: formData.email, // Gebruik email als username voor backend compatibility
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        password: formData.password,
        password_confirm: formData.password_confirm,
      });

      // Store user data
      authService.setCurrentUser(response.user);
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/account');
      }, 2000);

    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Account Aangemaakt!</h1>
            <p className="text-gray-600 mb-4">
              Welkom bij HealClinics! Je wordt automatisch doorgestuurd naar je account.
            </p>
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-lg w-full mx-4">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors mb-8"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Terug naar HealClinics</span>
        </button>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Account Aanmaken</h1>
            <p className="text-gray-600">Word lid van HealClinics Nederland</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <X className="h-5 w-5 text-red-600" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email - GEEN USERNAME MEER! */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mailadres *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                    validation.email.touched && !validation.email.valid
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="jouw@email.nl"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={() => handleFieldBlur('email')} // DELAYED VALIDATION
                />
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              {/* ALLEEN TONEN ALS TOUCHED EN INVALID */}
              {validation.email.touched && !validation.email.valid && (
                <p className="text-red-600 text-sm mt-1">Voer een geldig e-mailadres in</p>
              )}
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voornaam *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="Voornaam"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Achternaam *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="Achternaam"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                />
              </div>
            </div>

            {/* Phone - MET DELAYED VALIDATION */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefoonnummer (optioneel)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                    validation.phone.touched && !validation.phone.valid
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="06-12345678"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  onBlur={() => handleFieldBlur('phone')} // DELAYED VALIDATION
                />
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              {/* ALLEEN TONEN ALS TOUCHED EN INVALID */}
              {validation.phone.touched && !validation.phone.valid && (
                <p className="text-red-600 text-sm mt-1">Voer een geldig Nederlands telefoonnummer in</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wachtwoord *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="Wachtwoord"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                />
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">
                      {['Zeer zwak', 'Zwak', 'Matig', 'Goed', 'Sterk'][passwordStrength.score - 1] || 'Zeer zwak'}
                    </span>
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <p className="text-xs text-gray-500">
                      Nog nodig: {passwordStrength.feedback.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wachtwoord Bevestigen *
              </label>
              <div className="relative">
                <input
                  type={showPasswordConfirm ? 'text' : 'password'}
                  required
                  className={`w-full pl-12 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                    formData.password_confirm && formData.password !== formData.password_confirm
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="Bevestig wachtwoord"
                  value={formData.password_confirm}
                  onChange={(e) => handleInputChange('password_confirm', e.target.value)}
                />
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswordConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formData.password_confirm && formData.password !== formData.password_confirm && (
                <p className="text-red-600 text-sm mt-1">Wachtwoorden komen niet overeen</p>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agree_terms}
                  onChange={(e) => handleInputChange('agree_terms', e.target.checked)}
                  className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  required
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  Ik ga akkoord met de{' '}
                  <a href="#" className="text-green-600 hover:text-green-700 underline">
                    Algemene Voorwaarden
                  </a>{' '}
                  en het{' '}
                  <a href="#" className="text-green-600 hover:text-green-700 underline">
                    Privacybeleid
                  </a>{' '}
                  van HealClinics *
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.newsletter}
                  onChange={(e) => handleInputChange('newsletter', e.target.checked)}
                  className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  Ja, ik wil de HealClinics nieuwsbrief ontvangen met tips, aanbiedingen en productnieuws
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.agree_terms || passwordStrength.score < 3}
              className={`w-full py-4 text-sm font-medium uppercase tracking-wider rounded-lg transition-all duration-200 ${
                loading || !formData.agree_terms || passwordStrength.score < 3
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {loading ? 'Account aanmaken...' : 'Account Aanmaken'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Heb je al een HealClinics account?{' '}
              <button
                onClick={() => router.push('/auth/login')}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Inloggen
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
