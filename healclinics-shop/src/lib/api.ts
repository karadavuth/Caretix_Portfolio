import axios from 'axios';

// Django backend URL
const API_BASE_URL = 'http://127.0.0.1:8080/api';

// SIMPLIFIED: API client with minimal configuration to avoid rate limiting
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // Reduced timeout to 10 seconds
  withCredentials: false,
});

// MINIMAL: Response interceptor with NO retry logic to prevent rate limiting
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Success:', response.config.url, `(${response.status})`);
    return response;
  },
  async (error) => {
    // MINIMAL logging - no detailed error info that might cause issues
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
    });
    
    // NO RETRY LOGIC AT ALL - prevent any chance of rate limiting
    return Promise.reject(error);
  }
);

// Product types
export interface Product {
  id: number;
  name_nl: string;
  description: string;
  price: number;
  display_price: string;
  category: 'honing' | 'cupping' | 'supplementen';
  stock: number;
  is_active: boolean;
  created_at: string;
  image_url?: string;
}

// SIMPLIFIED: API functions with minimal error handling
export const productsApi = {
  // REMOVED: testConnection - eliminates unnecessary API calls
  
  // SIMPLIFIED: Get all products with absolute minimal error handling
  getAll: async (): Promise<Product[]> => {
    try {
      console.log('🔄 Loading products...');
      
      // Single API call - no connection test, no retries
      const response = await apiClient.get('/products/');
      
      const products = response.data.results || response.data;
      console.log(`✅ Loaded ${products.length} products`);
      
      return products;
    } catch (error: any) {
      // SILENT: Just log error and return empty array - no detailed logging
      console.error('❌ Products loading failed:', error.message);
      
      // Special handling for rate limiting
      if (error.response?.status === 429) {
        console.warn('⚠️ Rate limited - returning empty array');
      }
      
      // Always return empty array to prevent app crash
      return [];
    }
  },

  // SIMPLIFIED: Category products
  getByCategory: async (category: string): Promise<Product[]> => {
    try {
      console.log(`🔄 Loading ${category} products...`);
      const response = await apiClient.get(`/products/?category=${category}`);
      const products = response.data.results || response.data;
      console.log(`✅ Loaded ${products.length} ${category} products`);
      return products;
    } catch (error: any) {
      console.error(`❌ ${category} products failed:`, error.message);
      return [];
    }
  },

  // SIMPLIFIED: Search
  search: async (query: string): Promise<Product[]> => {
    try {
      if (query.length < 2) return [];
      
      const response = await apiClient.get(`/products/?search=${encodeURIComponent(query)}`);
      const results = response.data.results || response.data;
      return results;
    } catch (error: any) {
      console.error('❌ Search failed:', error.message);
      return [];
    }
  },

  // SIMPLIFIED: Get by ID
  getById: async (id: number): Promise<Product | null> => {
    try {
      console.log(`🔄 Loading product ${id}...`);
      const response = await apiClient.get(`/products/${id}/`);
      console.log(`✅ Product loaded: ${response.data.name_nl}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Product ${id} failed:`, error.message);
      return null;
    }
  },
};

export default apiClient;
