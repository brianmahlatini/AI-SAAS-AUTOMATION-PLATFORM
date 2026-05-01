import Stripe from "stripe";
import { config } from "../../config/env";
import { AppError } from "../../middleware/error";
import { findUserById } from "../users/user.repository";
import { getUsageSummary } from "./usage.repository";
import {
  findOwnerByStripeCustomer,
  getSubscription,
  upsertSubscription,
  type SubscriptionPlan
} from "./billing.repository";

const stripe = config.stripe.secretKey
  ? new Stripe(config.stripe.secretKey)
  : undefined;

export async function getBillingOverview(ownerId: string) {
  const [subscription, usage] = await Promise.all([
    getSubscription(ownerId),
    getUsageSummary(ownerId)
  ]);

  return {
    subscription,
    usage
  };
}

export async function createCheckoutSession(input: {
  ownerId: string;
  plan: Exclude<SubscriptionPlan, "FREE">;
}) {
  if (!stripe) {
    throw new AppError(500, "STRIPE_SECRET_KEY is not configured", "STRIPE_NOT_CONFIGURED");
  }

  const priceId = input.plan === "PRO" ? config.stripe.pricePro : config.stripe.priceEnterprise;
  if (!priceId) {
    throw new AppError(500, `Stripe price for ${input.plan} is not configured`, "STRIPE_PRICE_MISSING");
  }

  const user = await findUserById(input.ownerId);
  const existing = await getSubscription(input.ownerId);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: existing.stripeCustomerId,
    customer_email: existing.stripeCustomerId ? undefined : user?.email,
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    success_url: `${config.frontendUrl}/billing?checkout=success`,
    cancel_url: `${config.frontendUrl}/billing?checkout=cancelled`,
    metadata: {
      ownerId: input.ownerId,
      plan: input.plan
    },
    subscription_data: {
      metadata: {
        ownerId: input.ownerId,
        plan: input.plan
      }
    }
  });

  return {
    url: session.url
  };
}

export async function createBillingPortalSession(ownerId: string) {
  if (!stripe) {
    throw new AppError(500, "STRIPE_SECRET_KEY is not configured", "STRIPE_NOT_CONFIGURED");
  }

  const subscription = await getSubscription(ownerId);
  if (!subscription.stripeCustomerId) {
    throw new AppError(400, "No Stripe customer exists for this account", "CUSTOMER_NOT_FOUND");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${config.frontendUrl}/billing`
  });

  return {
    url: session.url
  };
}

export async function handleStripeWebhook(signature: string | undefined, rawBody: Buffer) {
  if (!stripe || !config.stripe.webhookSecret) {
    throw new AppError(500, "Stripe webhook is not configured", "STRIPE_NOT_CONFIGURED");
  }

  if (!signature) {
    throw new AppError(400, "Missing Stripe signature", "STRIPE_SIGNATURE_MISSING");
  }

  const event = stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const ownerId = session.metadata?.ownerId;
    const plan = normalizePlan(session.metadata?.plan);
    if (ownerId && session.customer) {
      await upsertSubscription({
        ownerId,
        stripeCustomerId: String(session.customer),
        stripeSubscriptionId: session.subscription ? String(session.subscription) : undefined,
        plan,
        status: "active"
      });
    }
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const ownerId =
      subscription.metadata.ownerId ??
      (subscription.customer ? await findOwnerByStripeCustomer(String(subscription.customer)) : undefined);

    if (ownerId) {
      await upsertSubscription({
        ownerId,
        stripeCustomerId: subscription.customer ? String(subscription.customer) : undefined,
        stripeSubscriptionId: subscription.id,
        plan: normalizePlan(subscription.metadata.plan),
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : undefined
      });
    }
  }

  return {
    received: true,
    type: event.type
  };
}

function normalizePlan(plan: unknown): SubscriptionPlan {
  return plan === "ENTERPRISE" ? "ENTERPRISE" : plan === "PRO" ? "PRO" : "FREE";
}
