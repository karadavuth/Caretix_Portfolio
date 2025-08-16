import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: number;
  name_nl: string;
  price: number;
  quantity: number;
  image_url?: string;
  stock: number;
  category?: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: any, quantity?: number) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  clearCart: () => void;
  isItemInCart: (id: number) => boolean;
  getCartItem: (id: number) => CartItem | undefined;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(item => item.id === product.id);
          
          if (existingItem) {
            const newQuantity = Math.min(
              existingItem.quantity + quantity, 
              product.stock || 999
            );
            
            return {
              items: state.items.map(item =>
                item.id === product.id
                  ? { ...item, quantity: newQuantity }
                  : item
              )
            };
          } else {
            // FIXED: Enhanced price parsing to match actual Django model fields
            let itemPrice = 0;
            
            // Priority order: direct price field → display_price → fallback to 0
            if (typeof product.price === 'number') {
              itemPrice = product.price;
            } else if (typeof product.price === 'string') {
              itemPrice = parseFloat(product.price.replace(',', '.')) || 0;
            } else if (typeof product.display_price === 'string') {
              itemPrice = parseFloat(product.display_price.replace(',', '.')) || 0;
            } else {
              console.warn('⚠️ Product price not found, using 0:', product);
              itemPrice = 0;
            }

            console.log(`💰 Adding product "${product.name_nl}" with price: €${itemPrice}`);

            const newItem: CartItem = {
              id: product.id,
              name_nl: product.name_nl,
              price: itemPrice,
              quantity: Math.min(quantity, product.stock || 999),
              image_url: product.image_url,
              stock: product.stock || 999,
              category: product.category
            };

            return {
              items: [...state.items, newItem]
            };
          }
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== id)
        }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        
        set((state) => ({
          items: state.items.map(item =>
            item.id === id
              ? { ...item, quantity: Math.min(quantity, item.stock) }
              : item
          )
        }));
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      // ENHANCED: Robust price calculation with comprehensive error handling
      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          let itemPrice = 0;
          
          // Handle different price data types
          if (typeof item.price === 'number') {
            itemPrice = item.price;
          } else if (typeof item.price === 'string') {
            // Parse string prices (e.g., "19.99" or "19,99")
            itemPrice = parseFloat(item.price.replace(',', '.')) || 0;
          } else {
            console.warn('⚠️ Invalid price type for item:', item);
            itemPrice = 0;
          }
          
          // Validate final price
          const validPrice = isNaN(itemPrice) || itemPrice < 0 ? 0 : itemPrice;
          
          return total + (validPrice * item.quantity);
        }, 0);
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      openCart: () => {
        set({ isOpen: true });
      },

      closeCart: () => {
        set({ isOpen: false });
      },

      clearCart: () => {
        set({ items: [], isOpen: false });
      },

      // Utility functions for better cart management
      isItemInCart: (id) => {
        return get().items.some(item => item.id === id);
      },

      getCartItem: (id) => {
        return get().items.find(item => item.id === id);
      },

      // NEW: Debug function to check cart state
      debugCart: () => {
        const state = get();
        console.log('🛒 Cart Debug Info:', {
          totalItems: state.getTotalItems(),
          totalPrice: state.getTotalPrice(),
          items: state.items.map(item => ({
            name: item.name_nl,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity
          }))
        });
      },
    }),
    {
      name: 'healclinics-cart',
      version: 2, // INCREMENTED: Updated to handle price field changes
      
      // Enhanced migrate function for price field updates
      migrate: (persistedState: any, version: number) => {
        // Migration from version 0 to 1
        if (version === 0) {
          return persistedState;
        }
        
        // Migration from version 1 to 2: Handle price field changes
        if (version === 1) {
          const state = persistedState as any;
          
          // Update any items that might have old price_incl_btw references
          if (state.items) {
            state.items = state.items.map((item: any) => {
              let newPrice = item.price;
              
              // If price is missing but price_incl_btw exists, migrate it
              if (!item.price && item.price_incl_btw) {
                newPrice = typeof item.price_incl_btw === 'string' 
                  ? parseFloat(item.price_incl_btw.replace(',', '.')) || 0
                  : item.price_incl_btw;
                
                console.log(`🔄 Migrating price for ${item.name_nl}: ${item.price_incl_btw} → ${newPrice}`);
              }
              
              return {
                ...item,
                price: newPrice,
                // Remove old field references
                price_incl_btw: undefined
              };
            });
          }
          
          return state;
        }
        
        return persistedState;
      },
    }
  )
);

// Export type for components that need it
export type { CartStore };
