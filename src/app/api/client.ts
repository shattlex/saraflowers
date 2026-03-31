export interface ContactPayload {
  name: string;
  phone: string;
  email: string;
  message: string;
}

export interface CheckoutCustomer {
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface ApiError {
  ok?: boolean;
  error?: string;
  details?: unknown;
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
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
  customer: CheckoutCustomer;
  items: CheckoutItem[];
  total: number;
  orderComment?: string;
}): Promise<{ confirmationUrl: string | null; orderId: string }> {
  return request('/api/payments/create', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
