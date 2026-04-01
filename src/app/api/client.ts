export interface ContactPayload {
  name: string;
  phone: string;
  email: string;
  message: string;
  consentPersonalData: boolean;
  consentTerms: boolean;
}

export interface CheckoutPerson {
  name: string;
  phone: string;
  email: string;
}

export interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CheckoutConsentPayload {
  offerAccepted: boolean;
  personalDataAccepted: boolean;
  marketingAccepted?: boolean;
  acceptedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  default_delivery_address: string | null;
  auth_provider: string;
  created_at: string;
}

export interface OrderHistoryItem {
  id: string;
  status: 'received' | 'assembled' | 'out_for_delivery' | 'delivered' | string;
  status_label: string;
  payment_status: string;
  total: string | number;
  delivery_address: string;
  created_at: string;
  updated_at: string;
  receipt_path: string | null;
  items_json: CheckoutItem[];
  payer_name: string;
  recipient_mode: 'self' | 'other';
  recipient_name: string | null;
}

interface ApiError {
  ok?: boolean;
  error?: string;
  details?: unknown;
  devCode?: string;
}

const AUTH_TOKEN_KEY = 'sf_auth_token';

export function getAuthToken(): string {
  return localStorage.getItem(AUTH_TOKEN_KEY) || '';
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...init
  });

  const data = (await response.json().catch(() => ({}))) as T & ApiError;
  if (!response.ok || (typeof data === 'object' && data !== null && 'ok' in data && data.ok === false)) {
    throw new Error((data as ApiError).error || `Request failed: ${response.status}`);
  }

  return data;
}

export async function submitContact(payload: ContactPayload): Promise<void> {
  await request('/api/contact', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function createPayment(payload: {
  payer: CheckoutPerson;
  recipient: CheckoutPerson;
  recipientMode: 'self' | 'other';
  items: CheckoutItem[];
  total: number;
  deliveryAddress: string;
  orderComment?: string;
  consents: CheckoutConsentPayload;
}): Promise<{ confirmationUrl: string | null; orderId: string }> {
  return request('/api/payments/create', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function createCashOrder(payload: {
  payer: CheckoutPerson;
  recipient: CheckoutPerson;
  recipientMode: 'self' | 'other';
  items: CheckoutItem[];
  total: number;
  deliveryAddress: string;
  orderComment?: string;
  consents: CheckoutConsentPayload;
}): Promise<{ orderId: string }> {
  return request('/api/orders/create-cash', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function register(payload: {
  name: string;
  email: string;
  phone: string;
  password: string;
  consentPersonalData: boolean;
  consentTerms: boolean;
}): Promise<{ token: string; user: UserProfile }> {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function login(payload: {
  login: string;
  password: string;
}): Promise<{ token: string; user: UserProfile }> {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function requestSmsCode(
  phone: string,
  consentPersonalData: boolean,
  consentTerms: boolean
): Promise<{ message: string; devCode?: string }> {
  return request('/api/auth/sms/request', {
    method: 'POST',
    body: JSON.stringify({
      phone,
      consentPersonalData,
      consentTerms
    })
  });
}

export async function verifySmsCode(payload: {
  phone: string;
  code: string;
  name?: string;
}): Promise<{ token: string; user: UserProfile }> {
  return request('/api/auth/sms/verify', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function me(): Promise<{ user: UserProfile }> {
  return request('/api/auth/me', { method: 'GET' });
}

export async function updateProfile(payload: {
  name: string;
  phone: string;
  email: string;
  defaultDeliveryAddress: string;
}): Promise<{ user: UserProfile }> {
  return request('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export async function myOrders(): Promise<{ orders: OrderHistoryItem[] }> {
  return request('/api/orders/my', { method: 'GET' });
}

export async function getOAuthStartUrl(provider: 'google' | 'yandex'): Promise<string> {
  const response = await request<{ url: string }>(`/api/auth/oauth/${provider}/start`, { method: 'GET' });
  return response.url;
}
