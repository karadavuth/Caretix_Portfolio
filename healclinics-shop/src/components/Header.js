'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart';
import { ShoppingCart, User, Menu, X } from 'lucide-react';
import { authService } from '@/lib/auth';

export default function Header() {
  const router = useRouter();
  const { getTotalItems, toggleCart } = useCartStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  const navigationItems = [
    { label: 'Producten', href: '/#producten' },
    { label: 'Over Ons', href: '/#over-ons' },
    { label: 'Contact', href: '/#contact' },
  ];

  const handleNavClick = (href) => {
    if (href.startsWith('/#')) {
      // If we're not on home page, navigate to home first
      if (window.location.pathname !== '/') {
        router.push('/');
        setTimeout(() => {
          const element = document.querySelector(href.substring(1));
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        // We're on home page, just scroll
        const element = document.querySelector(href.substring(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      router.push(href);
    }
    setIsMobileMenuOpen(false);
  };

  console.log('🔍 Header component rendering'); // Debug log

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer" 
            onClick={() => router.push('/')}
          >
            <h1 className="text-2xl font-bold tracking-tight hover:text-green-600 transition-colors">
              HealClinics
            </h1>
            <span className="ml-2 text-xs text-gray-500 uppercase tracking-wider">
              Nederland
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.href)}
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                {item.label}
              </button>
            ))}
            
            {/* Auth Link */}
            {isAuthenticated ? (
              <button
                onClick={() => router.push('/account')}
                className="text-gray-600 hover:text-green-600 transition-colors flex items-center gap-1"
              >
                <User className="h-4 w-4" />
                Mijn Account
              </button>
            ) : (
              <button
                onClick={() => router.push('/auth/login')}
                className="text-gray-600 hover:text-green-600 transition-colors flex items-center gap-1"
              >
                <User className="h-4 w-4" />
                Inloggen
              </button>
            )}
          </nav>

          {/* Mobile Menu Button & Cart */}
          <div className="flex items-center gap-2">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={toggleCart}
              className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <ShoppingCart className="h-6 w-6" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4">
            <nav className="flex flex-col space-y-4">
              {navigationItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.href)}
                  className="text-left text-gray-600 hover:text-green-600 transition-colors"
                >
                  {item.label}
                </button>
              ))}
              
              {/* Mobile Auth Link */}
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    router.push('/account');
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left text-gray-600 hover:text-green-600 transition-colors flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Mijn Account
                </button>
              ) : (
                <button
                  onClick={() => {
                    router.push('/auth/login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left text-gray-600 hover:text-green-600 transition-colors flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Inloggen
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
