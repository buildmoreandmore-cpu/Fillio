import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia' as any
});

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || '' // Use service key for admin operations
);

export const config = {
  api: {
    bodyParser: false // Stripe requires raw body
  }
};

async function buffer(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Stripe webhook secret not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, documentId, type } = session.metadata || {};

        if (userId && userId !== 'guest') {
          // Record the purchase
          await supabase.from('purchases').insert({
            user_id: userId,
            document_id: documentId || null,
            type: type as 'one-time' | 'subscription',
            stripe_payment_id: session.payment_intent as string || session.subscription as string,
            amount: session.amount_total || 0,
            status: 'completed'
          });

          // If subscription, update user to Pro
          if (type === 'subscription') {
            await supabase
              .from('profiles')
              .update({
                is_pro: true,
                stripe_customer_id: session.customer as string
              })
              .eq('id', userId);
          }

          // If scorecard purchase, update user tier to tier1
          if (type === 'scorecard') {
            await supabase
              .from('profiles')
              .update({
                tier: 'bank_ready',
                stripe_customer_id: session.customer as string
              })
              .eq('id', userId);
          }
        }

        // Payment processed
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID and downgrade
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ is_pro: false })
            .eq('id', profile.id);

          // Subscription downgraded
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        // Payment failed — could trigger email notification
        // Could send email notification here
        break;
      }

      default:
        // Unhandled event type — no action needed
    }

    return res.status(200).json({ received: true });

  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}
