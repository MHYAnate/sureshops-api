export interface ProductSearchResult {
  id: string;
  name: string;
  description?: string;
  brand?: string;
  category: string;
  subcategory?: string;
  images: string[];
  
  // Price info from this specific vendor
  price: number;
  originalPrice?: number;
  currency: string;
  inStock: boolean;
  
  // Vendor info
  vendor: {
    id: string;
    businessName: string;
    logo?: string;
    rating: number;
    isVerified: boolean;
    contactDetails: {
      phone: string;
      whatsapp?: string;
    };
  };
  
  // Location info
  location: {
    state: { id: string; name: string };
    area: { id: string; name: string };
    market?: { id: string; name: string; type: string };
    shopNumber?: string;
    shopAddress?: string;
    coordinates?: [number, number];
    distance?: number; // in km, if geo search
  };
}

export interface ProductWithVendors {
  // Product master info
  id: string;
  catalogItemId?: string;
  name: string;
  description?: string;
  brand?: string;
  category: string;
  subcategory?: string;
  images: string[];
  
  // Price summary
  priceRange: {
    lowest: number;
    highest: number;
    average: number;
    currency: string;
  };
  
  // All vendors selling this product
  totalVendors: number;
  vendors: VendorListing[];
}

export interface VendorListing {
  vendorId: string;
  productId: string;
  businessName: string;
  logo?: string;
  entrancePhoto?: string;
  rating: number;
  isVerified: boolean;
  
  // This vendor's price
  price: number;
  originalPrice?: number;
  inStock: boolean;
  quantity: number;
  
  // Contact
  contactDetails: {
    phone: string;
    whatsapp?: string;
    email?: string;
  };
  
  // Banking (for external transactions)
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
  
  // Location
  location: {
    state: { id: string; name: string };
    area: { id: string; name: string };
    market?: { id: string; name: string; type: string };
    shopNumber?: string;
    shopFloor?: string;
    shopBlock?: string;
    shopAddress?: string;
    landmark?: string;
    coordinates?: [number, number];
    distance?: number;
  };
  
  // Operating hours
  operatingHours?: {
    openingTime?: string;
    closingTime?: string;
    operatingDays?: string[];
    isOpen: boolean;
  };
}

export interface ShopSearchResult {
  id: string;
  businessName: string;
  businessDescription?: string;
  vendorType: string;
  
  // Images
  logo?: string;
  entrancePhoto?: string;
  layoutMap?: string;
  
  // Stats
  rating: number;
  reviewCount: number;
  totalProducts: number;
  isVerified: boolean;
  isFeatured: boolean;
  
  // Categories
  categories: string[];
  
  // Price Range
  priceRange: {
    min: number;
    max: number;
  };
  
  // Contact
  contactDetails: {
    phone: string;
    whatsapp?: string;
    email?: string;
    instagram?: string;
  };
  
  // Banking
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
  
  // Location
  location: {
    state: { id: string; name: string };
    area: { id: string; name: string };
    market?: { id: string; name: string; type: string };
    shopNumber?: string;
    shopFloor?: string;
    shopBlock?: string;
    shopAddress?: string;
    landmark?: string;
    coordinates?: [number, number];
    distance?: number;
  };
  
  // Operating
  operatingHours?: {
    openingTime?: string;
    closingTime?: string;
    operatingDays?: string[];
    isOpen: boolean;
  };
  
  // Sample products
  featuredProducts?: {
    id: string;
    name: string;
    price: number;
    image?: string;
  }[];
}

export interface SearchResults {
  query: string | undefined; 
  searchType: string;
  
  products?: {
    items: ProductSearchResult[];
    total: number;
    page: number;
    totalPages: number;
  };
  
  shops?: {
    items: ShopSearchResult[];
    total: number;
    page: number;
    totalPages: number;
  };
  
  // Aggregated product with all vendors
  productComparison?: {
    items: ProductWithVendors[];
    total: number;
  };
  
  // Filters available based on results
  availableFilters: {
    states: { id: string; name: string; count: number }[];
    areas: { id: string; name: string; count: number }[];
    markets: { id: string; name: string; count: number }[];
    categories: { name: string; count: number }[];
    brands: { name: string; count: number }[];
    priceRange: { min: number; max: number };
  };
  
  meta: {
    timestamp: string;
    took: number; // ms
  };
}