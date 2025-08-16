'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { 
  User, 
  LogOut, 
  Package, 
  Settings, 
  MapPin, 
  Mail, 
  Lock, 
  Trash2,
  Edit3,
  Check,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

// STAP 5: IMPORT ADDRESSBOOK COMPONENT
import AddressBook from '@/components/AddressBook';

interface UserData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
}

interface UserProfile {
  phone: string;
  newsletter_subscription: boolean;
}

type ActiveTab = 'overview' | 'profile' | 'address' | 'orders' | 'settings';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<UserProfile>({ phone: '', newsletter_subscription: true });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Edit form states
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    newsletter_subscription: true
  });

  // Password form states
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    // Get current user data
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setEditForm({
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
        email: currentUser.email,
        phone: profile.phone,
        newsletter_subscription: profile.newsletter_subscription
      });
    }
    
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    authService.logout();
    router.push('/auth/login');
  };

  const handleSaveProfile = async () => {
    // TODO: Implement API call to update profile
    console.log('Saving profile:', editForm);
    
    // Update local user state
    if (user) {
      const updatedUser = {
        ...user,
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email
      };
      setUser(updatedUser);
      authService.setCurrentUser(updatedUser);
    }
    
    setProfile({
      phone: editForm.phone,
      newsletter_subscription: editForm.newsletter_subscription
    });
    
    setIsEditing(false);
  };

  const handlePasswordChange = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert('Nieuwe wachtwoorden komen niet overeen');
      return;
    }
    
    // TODO: Implement API call to update password
    console.log('Changing password');
    
    setPasswordForm({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setShowPasswordForm(false);
    alert('Wachtwoord succesvol gewijzigd!');
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Weet je zeker dat je je account wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.'
    );
    
    if (confirmed) {
      // TODO: Implement API call to delete account
      console.log('Deleting account');
      authService.logout();
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Account laden...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Toegang geweigerd</h1>
          <p className="text-gray-600 mb-6">Je moet ingelogd zijn om je account te bekijken.</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="btn-primary"
          >
            Inloggen
          </button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    Welkom, {user.first_name} {user.last_name}!
                  </h2>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('orders')}
                  className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors text-left"
                >
                  <Package className="h-6 w-6 text-green-600 mb-2" />
                  <h3 className="font-semibold mb-1">Mijn Bestellingen</h3>
                  <p className="text-sm text-gray-600">Bekijk je order geschiedenis</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('profile')}
                  className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors text-left"
                >
                  <Settings className="h-6 w-6 text-blue-600 mb-2" />
                  <h3 className="font-semibold mb-1">Profiel Bewerken</h3>
                  <p className="text-sm text-gray-600">Update je persoonlijke gegevens</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('address')}
                  className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors text-left"
                >
                  <MapPin className="h-6 w-6 text-purple-600 mb-2" />
                  <h3 className="font-semibold mb-1">Adresboek</h3>
                  <p className="text-sm text-gray-600">Beheer je adressen</p>
                </button>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Profiel Bewerken</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 text-green-600 hover:text-green-700"
                >
                  <Edit3 className="h-4 w-4" />
                  Bewerken
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center gap-2 text-green-600 hover:text-green-700"
                  >
                    <Check className="h-4 w-4" />
                    Opslaan
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                    Annuleren
                  </button>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voornaam
                </label>
                <input
                  type="text"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                    isEditing 
                      ? 'border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500' 
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Achternaam
                </label>
                <input
                  type="text"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                    isEditing 
                      ? 'border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500' 
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-mailadres
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                    isEditing 
                      ? 'border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500' 
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefoonnummer
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="06-12345678"
                  className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                    isEditing 
                      ? 'border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500' 
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.newsletter_subscription}
                    onChange={(e) => setEditForm({ ...editForm, newsletter_subscription: e.target.checked })}
                    disabled={!isEditing}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Ja, ik wil de HealClinics nieuwsbrief ontvangen
                  </span>
                </label>
              </div>
            </div>

            {/* Password Change Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Wachtwoord</h3>
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="flex items-center gap-2 text-green-600 hover:text-green-700"
                >
                  <Lock className="h-4 w-4" />
                  Wachtwoord wijzigen
                </button>
              </div>

              {showPasswordForm && (
                <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Huidig wachtwoord
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Voer je huidige wachtwoord in"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nieuw wachtwoord
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Voer je nieuwe wachtwoord in"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bevestig nieuw wachtwoord
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordForm.confirm_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Bevestig je nieuwe wachtwoord"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handlePasswordChange}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Wachtwoord wijzigen
                    </button>
                    <button
                      onClick={() => setShowPasswordForm(false)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Annuleren
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6">Mijn Bestellingen</h2>
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nog geen bestellingen
              </h3>
              <p className="text-gray-600 mb-6">
                Je hebt nog geen bestellingen geplaatst bij HealClinics
              </p>
              <button
                onClick={() => router.push('/')}
                className="btn-primary"
              >
                Start met winkelen
              </button>
            </div>
          </div>
        );

      // STAP 5: ADDRESSBOOK COMPONENT INTEGRATIE
      case 'address':
        return <AddressBook />;

      case 'settings':
        return (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6">Account Instellingen</h2>
            
            <div className="space-y-6">
              <div className="p-6 border border-yellow-200 bg-yellow-50 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">Account Verwijderen</h3>
                <p className="text-yellow-700 text-sm mb-4">
                  Let op: Het verwijderen van je account kan niet ongedaan worden gemaakt. 
                  Al je gegevens, bestellingen en voorkeuren worden permanent verwijderd.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Account Verwijderen
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container-healclinics">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <span>← Terug naar HealClinics</span>
            </button>
            
            <h1 
              className="text-xl font-bold cursor-pointer hover:text-green-600 transition-colors"
              onClick={() => router.push('/')}
            >
              HealClinics Account
            </h1>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Uitloggen</span>
            </button>
          </div>
        </div>
      </header>

      {/* Account Dashboard */}
      <div className="container-healclinics py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-green-100 text-green-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Overzicht
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-green-100 text-green-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Profiel Bewerken
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'orders'
                      ? 'bg-green-100 text-green-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Mijn Bestellingen
                </button>
                <button
                  onClick={() => setActiveTab('address')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'address'
                      ? 'bg-green-100 text-green-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Adresboek
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'settings'
                      ? 'bg-green-100 text-green-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Instellingen
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
