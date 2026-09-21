export interface AuthUserAddress {
  id: string;
  title: string; // e.g. "Ev", "İş yeri"
  city: string; // e.g. "Bakı", "Xırdalan", "Sumqayıt"
  address: string;
  isDefault?: boolean;
}

export interface AuthUserOrder {
  id: string;
  orderNumber: string; // e.g. "SHR-9021"
  date: string;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  statusText: string;
  itemsCount: number;
  itemsDescription?: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  birthDate?: string;
  role?: 'customer' | 'vip';
  registeredAt: string;
  avatar?: string;
  addresses?: AuthUserAddress[];
  orders?: AuthUserOrder[];
}

export interface LoginCredentials {
  identifier: string; // phone or email
  password?: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  fullName: string;
  phone: string;
  email?: string;
  birthDate?: string;
  password?: string;
  termsAccepted: boolean;
}
