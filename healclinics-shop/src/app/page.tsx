'use client';

import { useEffect, useState } from 'react';
import { Product, productsApi } from '@/lib/api';
import { useCartStore } from '@/stores/cart';
import { ShoppingCart } from 'lucide-react';
import ChatBot from '@/components/chatbot';
import PaymentIcons from '@/components/PaymentIcons';
import CartSidebar from '@/components/CartSidebar';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import ProductGrid from '@/components/ProductGrid';
import Header from '@/components/Header';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStock, setShowStock] = useState(false);
  const [addedToCart, setAddedToCart] = useState<boolean>(false); // ✅ UPDATED: Simple boolean
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { addItem, getTotalItems, toggleCart } = useCartStore();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        // Add 1 second delay to prevent immediate rate limiting on page load
        console.log('⏳ Waiting 1 second before loading products...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const productsData = await productsApi.getAll();
        setProducts(productsData.slice(0, 8));
        setError(null);
      } catch (error) {
        console.error('Error loading products:', error);
        setError('Producten konden niet geladen worden.');
      } finally {
        setLoading(false);
      }
    };

    setIsAuthenticated(authService.isAuthenticated());
    loadProducts();
  }, []);

  // ✅ UPDATED: Simple toast handler
  const handleProductAddedToCart = () => {
    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
    }, 3000);
  };

  if (loading) {
    return <LoadingStateGymshark />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ✅ UPDATED: Simple Toast Message */}
      {addedToCart && (
        <div className="fixed top-20 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in-right">
          <ShoppingCart className="h-5 w-5" />
          <span className="font-medium">Toegevoegd aan winkelwagen!</span>
        </div>
      )}

      {/* Use shared Header component */}
      <Header />

      {/* Hero Section */}
      <section className="hero-gymshark py-20 lg:py-32">
        <div className="container-healclinics">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-hero mb-6">
                Premium
                <br />
                <span className="text-gradient-green">Biologische</span>
                <br />
                Producten
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-lg">
                Premium biologische honing, professionele cupping tools en natuurlijke supplementen voor optimale gezondheid.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <a href="#producten" className="btn-primary text-center">Shop Nu</a>
                <a href="#over-ons" className="btn-secondary text-center">Meer Info</a>
              </div>

              <div className="flex flex-wrap gap-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏆</span>
                  <span>Biologisch Gecertificeerd</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🚚</span>
                  <span>Gratis Verzending €50+</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛡️</span>
                  <span>Nederlandse Kwaliteit</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl mb-4">🍯</div>
                  <p className="text-lg font-semibold text-gray-800">Premium Biologische Honing</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ANCHOR LINK: Fix scroll to products */}
      <div id="producten" className="scroll-mt-20"></div>

      {/* ✅ UPDATED: ProductGrids with simple toast callback */}
      <ProductGrid 
        title="🍯 Biologische Honing Collectie" 
        category="honing" 
        limit={8}
        onAddToCart={handleProductAddedToCart}
      />

      <ProductGrid 
        title="🔧 Cupping Tools & Therapie" 
        category="cupping" 
        limit={8}
        onAddToCart={handleProductAddedToCart}
      />

      <ProductGrid 
        title="💊 Natuurlijke Supplementen" 
        category="supplementen" 
        limit={8}
        onAddToCart={handleProductAddedToCart}
      />

      {/* Over Ons Section */}
      <section id="over-ons" className="py-16 lg:py-24 bg-gray-50">
        <div className="container-healclinics">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-section-title">Over HealClinics</h3>
              <p className="text-lg text-gray-600">
                Nederlandse specialist in biologische producten en natuurlijke gezondheid
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h4 className="text-2xl font-bold mb-6">Onze Missie</h4>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Bij HealClinics geloven we in de kracht van natuurlijke, biologische producten. 
                  Sinds onze oprichting in Nederland leveren we premium biologische honing, 
                  professionele cupping tools en hoogwaardige supplementen.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-sm">100% Biologisch Gecertificeerd</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-sm">Nederlandse Kwaliteitsstandaard</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-sm">Duurzame Productie</span>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-yellow-50 to-green-50 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🌿</div>
                    <p className="text-lg font-semibold text-gray-800">Natuurlijk & Biologisch</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 lg:py-24">
        <div className="container-healclinics">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-section-title mb-8">Contact</h3>
            <p className="text-lg text-gray-600 mb-12">
              Heb je vragen over onze producten of wil je advies? 
              Ons Nederlandse klantenservice team helpt je graag!
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📧</span>
                </div>
                <h4 className="font-semibold mb-2">Email</h4>
                <p className="text-green-600 font-medium">info@healclinics.nl</p>
                <p className="text-sm text-gray-500">Reactie binnen 24u</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📞</span>
                </div>
                <h4 className="font-semibold mb-2">Telefoon</h4>
                <p className="text-green-600 font-medium">020-1234567</p>
                <p className="text-sm text-gray-500">Ma-vr 9:00-17:00</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <h4 className="font-semibold mb-2">Live Chat</h4>
                <p className="text-green-600 font-medium">Chatbot</p>
                <p className="text-sm text-gray-500">24/7 beschikbaar</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-8">
              <h4 className="text-xl font-bold mb-4">Klantenservice</h4>
              <p className="text-gray-600">
                Onze Nederlandse klantenservice staat voor je klaar voor vragen over 
                producten, bestellingen, retourzendingen en alles wat met HealClinics te maken heeft.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Components */}
      <PaymentIcons />
      <ChatBot />

      {/* Debug Toggle */}
      <div className="fixed bottom-4 left-4 z-40">
        <button
          onClick={() => setShowStock(!showStock)}
          className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
        >
          {showStock ? 'Hide' : 'Show'} Stock
        </button>
      </div>

      <CartSidebar />
    </div>
  );
}

// Bestaande components blijven exact hetzelfde
function LoadingStateGymshark() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-xl font-bold mb-2">HealClinics</h2>
        <p className="text-gray-600">Producten laden...</p>
      </div>
    </div>
  );
}

function ErrorStateGymshark({ error }: { error: string }) {
  return (
    <div className="text-center py-16">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">⚠️</span>
        </div>
        <h3 className="text-xl font-bold mb-4">Er ging iets mis</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <p className="text-sm text-gray-500">Check of je Django backend draait op http://127.0.0.1:8080</p>
      </div>
    </div>
  );
}

// FIXED: ProductCard with Link to Product Detail Page
function ProductCardGymshark({ 
  product, 
  showStock, 
  onAddToCart,
  onClick,
  isJustAdded = false
}: { 
  product: Product; 
  showStock: boolean;
  onAddToCart: () => void;
  onClick?: () => void;
  isJustAdded?: boolean;
}) {
  const getProductImage = (product: Product): string => {
    const productImages: { [key: number]: string } = {
      1: '/images/products/honing/1-Heal-Clinics-acacia-honing-450-gram.jpg',
      2: '/images/products/honing/2-bos-goud-honing-450-gram.jpg',
      3: '/images/products/supplemente/3-Alga-Xifa.jpg',
      4: '/images/products/cupping/4-hijama-cups-kopen-12.jpg',
      5: '/images/products/cupping/5-hijama-cups-kopen-60.jpg',
      6: '/images/products/supplementen/6-i-ravent.jpg',
      7: '/images/products/supplementen/7-ittirifil.jpg',
      8: '/images/products/supplementen/8-Ruslan.jpg',
    };
    
    return productImages[product.id] || `/images/products/${product.category}/default-${product.category}.jpg`;
  };

  const getCategoryInfo = (category: string) => {
    const info = {
      honing: { label: 'Biologische Honing', color: 'text-yellow-600' },
      cupping: { label: 'Cupping Tools', color: 'text-blue-600' },
      supplementen: { label: 'Supplementen', color: 'text-green-600' },
    };
    return info[category as keyof typeof info] || info.supplementen;
  };

  const categoryInfo = getCategoryInfo(product.category);
  const productImageSrc = getProductImage(product);

  return (
    <Link href={`/products/${product.id}`} className="block">
      <div className="product-card-gymshark group hover:-translate-y-1 cursor-pointer">
        <div className="aspect-square bg-gray-50 mb-6 overflow-hidden rounded-lg">
          <img
            src={productImageSrc}
            alt={product.name_nl}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.src.includes('default-')) {
                target.src = `/images/products/${product.category}/default-${product.category}.jpg`;
              } else {
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <div class="text-center">
                        <div class="text-6xl mb-2">
                          ${product.category === 'honing' ? '🍯' : 
                            product.category === 'cupping' ? '🔧' : '💊'}
                        </div>
                        <p class="text-xs text-gray-500">${product.name_nl}</p>
                      </div>
                    </div>
                  `;
                }
              }
            }}
          />
        </div>

        <div className="space-y-3">
          <div className={`text-xs uppercase tracking-wider font-medium ${categoryInfo.color}`}>
            {categoryInfo.label}
          </div>

          <h4 className="text-product-title group-hover:text-green-600">
            {product.name_nl}
          </h4>

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">
              €{product.display_price}
            </span>
          </div>

          <div className={showStock ? 'stock-display' : 'stock-hidden'}>
            <span className={`text-sm ${
              product.stock > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {product.stock > 0 ? `${product.stock} op voorraad` : 'Uitverkocht'}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault(); // Prevent Link navigation when clicking button
              e.stopPropagation();
              onAddToCart();
            }}
            disabled={product.stock === 0}
            className={`w-full py-3 text-sm font-medium uppercase tracking-wider transition-all duration-200 ${
              isJustAdded 
                ? 'bg-green-600 text-white'
                : product.stock > 0
                ? 'bg-black text-white hover:bg-gray-800'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isJustAdded 
              ? '✓ Toegevoegd!' 
              : product.stock > 0 
              ? 'Toevoegen aan winkelwagen' 
              : 'Uitverkocht'
            }
          </button>
        </div>
      </div>
    </Link>
  );
}
