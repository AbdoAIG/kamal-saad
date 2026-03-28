import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  name: string;
  nameAr: string;
  description: string | null;
  descriptionAr: string | null;
  price: number;
  discountPrice: number | null;
  images: string[];
  stock: number;
  categoryId: string;
  rating: number;
  salesCount: number;
  featured: boolean;
  category?: {
    id: string;
    name: string;
    nameAr: string;
  };
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  phone?: string | null;
  address?: string | null;
}

interface ShopState {
  // User
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Cart
  cartItems: CartItem[];
  setCartItems: (items: CartItem[]) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  
  // UI State
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  
  // Selected product for detail view
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Filters
  selectedCategory: string | null;
  setSelectedCategory: (categoryId: string | null) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
}

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      // User
      user: null,
      setUser: (user) => set({ user }),
      
      // Cart
      cartItems: [],
      setCartItems: (items) => set({ cartItems: items }),
      
      addToCart: (product, quantity = 1) => {
        const { cartItems } = get();
        const existingItem = cartItems.find(
          (item) => item.productId === product.id
        );
        
        if (existingItem) {
          set({
            cartItems: cartItems.map((item) =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          const newItem: CartItem = {
            id: `temp-${Date.now()}`,
            productId: product.id,
            quantity,
            product,
          };
          set({ cartItems: [...cartItems, newItem] });
        }
      },
      
      removeFromCart: (itemId) => {
        set({ cartItems: get().cartItems.filter((item) => item.id !== itemId) });
      },
      
      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(itemId);
          return;
        }
        set({
          cartItems: get().cartItems.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        });
      },
      
      clearCart: () => set({ cartItems: [] }),
      
      getCartTotal: () => {
        return get().cartItems.reduce((total, item) => {
          const price = item.product.discountPrice || item.product.price;
          return total + price * item.quantity;
        }, 0);
      },
      
      getCartCount: () => {
        return get().cartItems.reduce((count, item) => count + item.quantity, 0);
      },
      
      // UI State
      isCartOpen: false,
      setCartOpen: (open) => set({ isCartOpen: open }),
      
      isAuthModalOpen: false,
      setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
      
      authMode: 'login',
      setAuthMode: (mode) => set({ authMode: mode }),
      
      // Selected product
      selectedProduct: null,
      setSelectedProduct: (product) => set({ selectedProduct: product }),
      
      // Search
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      // Filters
      selectedCategory: null,
      setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),
      
      priceRange: [0, 200],
      setPriceRange: (range) => set({ priceRange: range }),
      
      sortBy: 'newest',
      setSortBy: (sort) => set({ sortBy: sort }),
    }),
    {
      name: 'maktabati-store',
      partialize: (state) => ({
        user: state.user,
        cartItems: state.cartItems,
      }),
    }
  )
);
