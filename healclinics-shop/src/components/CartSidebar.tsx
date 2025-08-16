'use client';

import { useCartStore } from '@/stores/cart';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CartSidebar() {
  const router = useRouter();
  const {
    items,
    isOpen,
    toggleCart,
    removeItem,
    updateQuantity,
    getTotalPrice,
    getTotalItems,
    clearCart
  } = useCartStore();

  const handleQuantityDecrease = (id: number, quantity: number) => {
    if (quantity <= 1) {
      removeItem(id);
    } else {
      updateQuantity(id, quantity - 1);
    }
  };

  const handleCheckout = () => {
    router.push('/checkout');
    toggleCart();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={toggleCart}
      ></div>

      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-semibold">Winkelwagen ({getTotalItems()})</h2>
            <button
              onClick={toggleCart}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Je winkelwagen is leeg</h3>
                <p className="text-gray-600 mb-6">Voeg producten toe om te beginnen met winkelen</p>
                <button
                  onClick={toggleCart}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Verder Winkelen
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.id} className="border-b border-gray-100 pb-6">
                    <div className="flex gap-4 mb-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name_nl}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs text-gray-400">📦</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        {/* ✅ ONLY PRODUCT NAME - NO PRICE PER UNIT */}
                        <h3 className="font-medium text-sm line-clamp-2">{item.name_nl}</h3>
                        {/* ❌ REMOVED: <p className="text-sm text-gray-600 mt-1">€{item.price} per stuk</p> */}
                      </div>
                    </div>

                    {/* Layout: Prijs links, Quantity controls rechts */}
                    <div className="flex items-center justify-between">
                      {/* Prijs links */}
                      <div className="font-semibold text-green-600">
                        €{(item.price * item.quantity).toFixed(2)}
                      </div>

                      {/* Quantity controls rechts */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">Aantal:</span>
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => handleQuantityDecrease(item.id, item.quantity)}
                            className="p-2 hover:bg-gray-50 transition-colors"
                            title={item.quantity <= 1 ? "Product verwijderen" : "Aantal verminderen"}
                          >
                            <Minus className="h-3 w-3" />
                          </button>

                          <span className="px-4 py-2 text-sm font-medium min-w-[50px] text-center">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 hover:bg-gray-50 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t p-6 space-y-4">
              <div className="flex justify-end">
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">Totaal bestelling:</div>
                  <div className="text-xl font-bold text-green-600">
                    €{getTotalPrice().toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Inclusief gratis verzending
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Bestellen
                </button>
                
                <button
                  onClick={toggleCart}
                  className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Verder winkelen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
