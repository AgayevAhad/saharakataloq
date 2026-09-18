export interface AuthUser {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role?: 'customer' | 'vip';
  registeredAt: string;
  avatar?: string;
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
  password?: string;
  termsAccepted: boolean;
}
