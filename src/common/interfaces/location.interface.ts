export interface GeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Address {
  street?: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
}

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  bankCode?: string;
}

export interface ContactDetails {
  phone: string;
  alternatePhone?: string;
  email?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  website?: string;
}

export interface ShopImages {
  entrancePhoto?: string;
  logo?: string;
  layoutMap?: string;
  additionalImages?: string[];
}