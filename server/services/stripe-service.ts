import Stripe from 'stripe';
import { storage } from '../storage';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export const STRIPE_PRICE_IDS = {
  starter: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter',
  professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional', 
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
} as const;

export type StripePlan = keyof typeof STRIPE_PRICE_IDS;

interface CustomerData {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

interface SubscriptionData {
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
  trialDays?: number;
}

class StripeService {
  
  /**
   * Create a new Stripe customer
   */
  async createCustomer(data: CustomerData): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.create({
        email: data.email,
        name: data.name,
        metadata: data.metadata || {},
      });
      
      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw new Error('Failed to create customer account');
    }
  }

  /**
   * Create a subscription for a customer
   */
  async createSubscription(
    email: string,
    name: string,
    priceId: string,
    trialDays?: number
  ): Promise<Stripe.Subscription> {
    try {
      // Check if customer already exists
      let customer = await this.findCustomerByEmail(email);
      
      if (!customer) {
        customer = await this.createCustomer({ email, name });
      }

      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: email, // We'll update this with actual user ID later
          planType: this.getPlanTypeFromPriceId(priceId),
        },
      };

      if (trialDays) {
        subscriptionData.trial_period_days = trialDays;
      }

      const subscription = await stripe.subscriptions.create(subscriptionData);
      
      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Update a subscription (change plan)
   */
  async updateSubscription(
    subscriptionId: string,
    newPriceId: string
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
      });
      
      return updatedSubscription;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string, immediately = false): Promise<Stripe.Subscription> {
    try {
      if (immediately) {
        return await stripe.subscriptions.cancel(subscriptionId);
      } else {
        return await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Reactivate a subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw new Error('Failed to reactivate subscription');
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['latest_invoice', 'customer'],
      });
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      throw new Error('Failed to retrieve subscription');
    }
  }

  /**
   * Get customer's subscription history
   */
  async getCustomerSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        expand: ['data.latest_invoice'],
      });
      
      return subscriptions.data;
    } catch (error) {
      console.error('Error retrieving customer subscriptions:', error);
      throw new Error('Failed to retrieve subscription history');
    }
  }

  /**
   * Get customer's invoices
   */
  async getCustomerInvoices(customerId: string, limit = 10): Promise<Stripe.Invoice[]> {
    try {
      const invoices = await stripe.invoices.list({
        customer: customerId,
        limit,
        expand: ['data.payment_intent'],
      });
      
      return invoices.data;
    } catch (error) {
      console.error('Error retrieving customer invoices:', error);
      throw new Error('Failed to retrieve invoices');
    }
  }

  /**
   * Create a payment intent for one-time payments
   */
  async createPaymentIntent(
    amount: number,
    currency = 'usd',
    customerId?: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: customerId,
        metadata: metadata || {},
        automatic_payment_methods: {
          enabled: true,
        },
      });
      
      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(
    body: string,
    signature: string,
    endpointSecret: string
  ): Promise<void> {
    try {
      const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
      
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
          
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
          
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
          
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
          
        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
          break;
          
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Webhook error:', error);
      throw new Error('Webhook processing failed');
    }
  }

  /**
   * Get usage-based billing data
   */
  async getUsageData(subscriptionId: string, startDate: Date, endDate: Date): Promise<{
    arViews: number;
    modelsCreated: number;
    storageUsed: number;
    teamMembers: number;
  }> {
    try {
      // This would query your database for usage metrics
      // For now, return placeholder data
      return {
        arViews: 15234,
        modelsCreated: 42,
        storageUsed: 2.1, // GB
        teamMembers: 5,
      };
    } catch (error) {
      console.error('Error retrieving usage data:', error);
      return { arViews: 0, modelsCreated: 0, storageUsed: 0, teamMembers: 0 };
    }
  }

  /**
   * Create a billing portal session
   */
  async createBillingPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      
      return session;
    } catch (error) {
      console.error('Error creating billing portal session:', error);
      throw new Error('Failed to create billing portal session');
    }
  }

  /**
   * Private helper methods
   */
  private async findCustomerByEmail(email: string): Promise<Stripe.Customer | null> {
    try {
      const customers = await stripe.customers.list({
        email,
        limit: 1,
      });
      
      return customers.data.length > 0 ? customers.data[0] : null;
    } catch (error) {
      console.error('Error finding customer by email:', error);
      return null;
    }
  }

  private getPlanTypeFromPriceId(priceId: string): string {
    for (const [plan, id] of Object.entries(STRIPE_PRICE_IDS)) {
      if (id === priceId) return plan;
    }
    return 'unknown';
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    try {
      const subscriptionId = invoice.subscription as string;
      const customerId = invoice.customer as string;
      
      // Update user's subscription status in database
      const user = await storage.getUserByStripeCustomerId?.(customerId);
      if (user) {
        await storage.upsertUser({
          ...user,
          subscriptionStatus: 'active',
          updatedAt: new Date(),
        });
      }
      
      console.log(`Payment succeeded for subscription ${subscriptionId}`);
    } catch (error) {
      console.error('Error handling payment succeeded:', error);
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    try {
      const subscriptionId = invoice.subscription as string;
      const customerId = invoice.customer as string;
      
      // Update user's subscription status in database
      const user = await storage.getUserByStripeCustomerId?.(customerId);
      if (user) {
        await storage.upsertUser({
          ...user,
          subscriptionStatus: 'past_due',
          updatedAt: new Date(),
        });
      }
      
      console.log(`Payment failed for subscription ${subscriptionId}`);
    } catch (error) {
      console.error('Error handling payment failed:', error);
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    try {
      const customerId = subscription.customer as string;
      const planType = this.getPlanTypeFromPriceId(subscription.items.data[0]?.price.id || '');
      
      // Update user's subscription info in database
      const user = await storage.getUserByStripeCustomerId?.(customerId);
      if (user) {
        await storage.upsertUser({
          ...user,
          subscriptionPlan: planType as any,
          subscriptionStatus: subscription.status as any,
          updatedAt: new Date(),
        });
      }
      
      console.log(`Subscription updated: ${subscription.id}`);
    } catch (error) {
      console.error('Error handling subscription updated:', error);
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    try {
      const customerId = subscription.customer as string;
      
      // Update user's subscription status in database
      const user = await storage.getUserByStripeCustomerId?.(customerId);
      if (user) {
        await storage.upsertUser({
          ...user,
          subscriptionStatus: 'canceled',
          subscriptionPlan: 'starter',
          updatedAt: new Date(),
        });
      }
      
      console.log(`Subscription deleted: ${subscription.id}`);
    } catch (error) {
      console.error('Error handling subscription deleted:', error);
    }
  }

  private async handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
    try {
      // Send notification to user about trial ending
      console.log(`Trial will end for subscription: ${subscription.id}`);
    } catch (error) {
      console.error('Error handling trial will end:', error);
    }
  }
}

export const stripeService = new StripeService();
