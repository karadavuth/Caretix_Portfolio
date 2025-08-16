'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/stores/cart';

interface Product {
  id: number;
  name_nl: string;
  short_description: string;
  image_url: string;
  price: number;
  original_price?: number;
  is_on_sale: boolean;
  sale_percentage: number;
  category: string;
  is_featured: boolean;
  stock: number;
}

interface ProductGridProps {
  title?: string;
  featured?: boolean;
  category?: string;
  limit?: number;
  onAddToCart?: () => void; // ✅ NEW PROP: Simple callback for toast
}

export default function ProductGrid({ 
  title = "Onze Producten",
  featured = false,
  category,
  limit = 8,
  onAddToCart // ✅ NEW PROP: Toast callback
}: ProductGridProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState<number | null>(null);
  const { addItem } = useCartStore();

  useEffect(() => {
    loadProducts();
  }, [featured, category, limit]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      let url = 'http://127.0.0.1:8080/api/products/';
      
      const params = new URLSearchParams();
      if (featured) params.append('featured', 'true');
      if (category) params.append('category', category);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        const results = data.results || data;
        setProducts(results.slice(0, limit));
      } else {
        setError('Fout bij laden producten');
      }
    } catch (error) {
      console.error('Products load error:', error);
      setError('Verbindingsfout');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'honing': 'Biologische Honing',
      'manuka': 'Manuka Honing',
      'cupping': 'Cupping Tools',
      'supplementen': 'Supplementen',
      'vitamines': 'Vitamines',
    };
    return categoryMap[category] || category;
  };

  // ✅ UPDATED: Enhanced handleAddToCart with toast callback
  const handleAddToCart = (product: Product) => {
    addItem(product);
    
    // ✅ NEW: Call homepage toast callback if provided
    if (onAddToCart) {
      onAddToCart();
    }
    
    // Local button feedback
    setAddedToCart(product.id);
    setTimeout(() => setAddedToCart(null), 2000);
  };

  if (loading) {
    return (
      <section className="py-12">
        <div className="container-healclinics">
          <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12">
        <div className="container-healclinics">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="container-healclinics">
        <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>
        
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Geen producten gevonden.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group">
                {/* Product Image */}
                <div 
                  className="aspect-square mb-4 relative overflow-hidden rounded-lg bg-gray-100 cursor-pointer"
                  onClick={() => router.push(`/products/${product.id}`)}
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name_nl}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        console.error('Image failed to load:', product.image_url);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-400">Geen afbeelding</span>
                    </div>
                  )}
                  
                  {/* Sale Badge */}
                  {product.is_on_sale && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
                      -{product.sale_percentage}%
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    {getCategoryName(product.category)}
                  </div>
                  
                  <h3 
                    className="font-semibold text-gray-900 line-clamp-2 cursor-pointer hover:text-green-600 transition-colors"
                    onClick={() => router.push(`/products/${product.id}`)}
                  >
                    {product.name_nl}
                  </h3>
                  
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {product.short_description}
                  </p>
                  
                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-green-600">€{product.price}</span>
                    {product.is_on_sale && product.original_price && (
                      <span className="text-sm text-gray-400 line-through">€{product.original_price}</span>
                    )}
                  </div>
                  
                  {/* Stock Status */}
                  <div className="text-xs">
                    {product.stock > 0 ? (
                      <span className="text-green-600">✓ Op voorraad</span>
                    ) : (
                      <span className="text-red-600">✗ Niet op voorraad</span>
                    )}
                  </div>
                </div>

                {/* ✅ ENHANCED: Add to Cart Button with toast callback */}
                <button 
                  onClick={() => handleAddToCart(product)}
                  className={`w-full mt-4 text-sm font-medium py-3 rounded-lg transition-all duration-200 ${
                    addedToCart === product.id
                      ? 'bg-green-600 text-white scale-105'
                      : product.stock > 0
                      ? 'bg-black text-white hover:bg-gray-800 hover:scale-105'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={product.stock === 0}
                >
                  {addedToCart === product.id ? (
                    '✓ Toegevoegd!'
                  ) : product.stock > 0 ? (
                    <>
                      <ShoppingCart className="h-4 w-4 inline mr-2" />
                      Toevoegen aan Winkelwagen
                    </>
                  ) : (
                    'Niet Beschikbaar'
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* View More Button */}
        {products.length >= limit && (
          <div className="text-center mt-12">
            <button
              onClick={() => router.push('/products')}
              className="btn-secondary"
            >
              Bekijk Alle Producten
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
