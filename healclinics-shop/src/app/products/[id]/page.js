'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingCart, Truck, Shield, Leaf } from 'lucide-react';
import { useCartStore } from '@/stores/cart';
import { productsApi } from '@/lib/api';
import Header from '@/components/Header';
import CartSidebar from '@/components/CartSidebar';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem, openCart } = useCartStore();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showAddedNotification, setShowAddedNotification] = useState(false); // ✅ Simple boolean

  // Fetch product from Django backend
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔍 Fetching product with ID:', params.id);
        const productData = await productsApi.getById(parseInt(params.id));
        
        if (productData) {
          setProduct(productData);
          console.log('✅ Product loaded:', productData.name_nl);
        } else {
          setError('Product niet gevonden');
        }
      } catch (err) {
        console.error('❌ Failed to fetch product:', err);
        setError('Fout bij het laden van het product');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  // ✅ UPDATED: Simple handleAddToCart
  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity);
      console.log(`✅ Added ${quantity}x ${product.name_nl} to cart`);
      
      // Show simple toast notification
      setShowAddedNotification(true);
      setTimeout(() => {
        setShowAddedNotification(false);
      }, 3000);
    }
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Product laden...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product niet gevonden</h1>
            <p className="text-gray-600 mb-6">{error || 'Het gevraagde product bestaat niet.'}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Terug naar shop
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Shared Header */}
      <Header />

      {/* ✅ UPDATED: Simple Toast Notification */}
      {showAddedNotification && (
        <div className="fixed top-20 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in-right">
          <ShoppingCart className="h-5 w-5" />
          <span className="font-medium">Toegevoegd aan winkelwagen!</span>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <button 
            onClick={() => router.push('/')} 
            className="hover:text-green-600 transition-colors"
          >
            Home
          </button>
          <span>/</span>
          <button 
            onClick={() => router.push(`/?category=${product.category}`)} 
            className="hover:text-green-600 capitalize transition-colors"
          >
            {product.category}
          </button>
          <span>/</span>
          <span className="text-gray-900">{product.name_nl}</span>
        </div>
      </nav>

      {/* Back Button */}
      <div className="max-w-6xl mx-auto px-4 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar vorige pagina
        </button>
      </div>

      {/* Product Content */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={product.image_url || '/api/placeholder/400/400'}
                alt={product.name_nl}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/api/placeholder/400/400';
                  console.log('🖼️ Image fallback used for product:', product.name_nl);
                }}
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name_nl}</h1>
              
              {/* Price */}
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-bold text-green-600">
                  €{typeof product.price === 'number' 
                    ? product.price.toFixed(2).replace('.', ',')
                    : product.display_price || '0,00'
                  }
                </span>
                <span className="text-gray-500">per stuk</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-gray-700 leading-relaxed text-lg">
                {product.description || 'Geen beschrijving beschikbaar.'}
              </p>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                product.stock > 10 
                  ? 'bg-green-500' 
                  : product.stock > 0 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-600">
                {product.stock > 10 
                  ? 'Op voorraad' 
                  : product.stock > 0 
                    ? `Nog ${product.stock} stuks` 
                    : 'Uitverkocht'
                }
              </span>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Aantal:</label>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="px-3 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x border-gray-300 min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="px-3 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                {product.stock > 0 ? 'Toevoegen aan winkelwagen' : 'Uitverkocht'}
              </button>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="text-center">
                <Truck className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-sm">
                  <div className="font-medium">Gratis verzending</div>
                  <div className="text-gray-500">Binnen Nederland</div>
                </div>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-sm">
                  <div className="font-medium">Kwaliteitsgarantie</div>
                  <div className="text-gray-500">100% natuurlijk</div>
                </div>
              </div>
              <div className="text-center">
                <Leaf className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-sm">
                  <div className="font-medium">Duurzaam</div>
                  <div className="text-gray-500">Verantwoord</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CartSidebar */}
      <CartSidebar />
    </div>
  );
}
