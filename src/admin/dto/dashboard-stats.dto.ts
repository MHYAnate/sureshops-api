export interface DashboardStats {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    byRole: { role: string; count: number }[];
  };
  vendors: {
    total: number;
    verified: number;
    pending: number;
    featured: number;
    newThisMonth: number;
  };
  products: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    newThisMonth: number;
  };
  locations: {
    states: number;
    areas: number;
    markets: number;
  };
  activity: {
    totalViews: number;
    totalSearches: number;
  };
}

export interface RecentActivity {
  type: 'user_registered' | 'vendor_created' | 'product_added' | 'vendor_verified';
  message: string;
  timestamp: Date;
  data?: any;
}