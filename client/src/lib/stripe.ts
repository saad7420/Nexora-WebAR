import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || process.env.VITE_STRIPE_PUBLIC_KEY;
    
    if (!publishableKey) {
      throw new Error('Missing Stripe publishable key. Please set VITE_STRIPE_PUBLIC_KEY in your environment variables.');
    }
    
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

export { getStripe };

export const STRIPE_PRICE_IDS = {
  starter: process.env.VITE_STRIPE_STARTER_PRICE_ID || 'price_starter',
  professional: process.env.VITE_STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional',
  enterprise: process.env.VITE_STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
} as const;

export type StripePlan = keyof typeof STRIPE_PRICE_IDS;

export interface PaymentIntentData {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

export interface SubscriptionData {
  priceId: string;
  customer?: {
    email: string;
    name?: string;
  };
  metadata?: Record<string, string>;
}

export const formatPrice = (amount: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount / 100);
};

export const createPaymentIntent = async (data: PaymentIntentData) => {
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create payment intent');
  }

  return response.json();
};

export const createSubscription = async (data: SubscriptionData) => {
  const response = await fetch('/api/create-subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create subscription');
  }

  return response.json();
};

export const cancelSubscription = async (subscriptionId: string) => {
  const response = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to cancel subscription');
  }

  return response.json();
};

export const updateSubscription = async (subscriptionId: string, priceId: string) => {
  const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ priceId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update subscription');
  }

  return response.json();
};
