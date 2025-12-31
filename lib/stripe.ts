// Stripe configuration for client-side
// Note: Stripe checkout is handled via API routes for security

export const STRIPE_PRICES = {
  ONE_TIME_DOWNLOAD: 'price_one_time_9', // $9 one-time
  PRO_MONTHLY: 'price_pro_monthly_12',    // $12/month subscription
} as const;

export const STRIPE_CONFIG = {
  ONE_TIME_AMOUNT: 900,  // $9.00 in cents
  PRO_AMOUNT: 1200,      // $12.00 in cents
} as const;

export const isStripeConfigured = () => {
  return !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
};
