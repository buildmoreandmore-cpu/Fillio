import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia' as any
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { priceType, userId, documentId, successUrl, cancelUrl } = req.body;

  if (!priceType || !successUrl || !cancelUrl) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    let sessionConfig: Stripe.Checkout.SessionCreateParams;

    if (priceType === 'one-time') {
      // One-time purchase for $9
      sessionConfig = {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Document Download',
                description: 'One-time download of your Personal Financial Statement',
              },
              unit_amount: 900, // $9.00
            },
            quantity: 1,
          },
        ],
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&type=one-time`,
        cancel_url: cancelUrl,
        metadata: {
          userId: userId || 'guest',
          documentId: documentId || '',
          type: 'one-time'
        }
      };
    } else if (priceType === 'subscription') {
      // Pro subscription for $12/month
      sessionConfig = {
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Fillio Pro',
                description: 'Unlimited documents, bank sync, cloud storage',
              },
              unit_amount: 1200, // $12.00
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&type=subscription`,
        cancel_url: cancelUrl,
        metadata: {
          userId: userId || 'guest',
          type: 'subscription'
        }
      };
    } else {
      return res.status(400).json({ error: 'Invalid price type' });
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return res.status(200).json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      details: error.message
    });
  }
}
