import type { Express, Request, Response } from "express";
import Stripe from "stripe";
import { storage } from "./storage";
import { log } from "./app";
import type { PlanName, SubscriptionStatus } from "@shared/schema";

// ---------------------------------------------------------------------------
// Stripe instance (lazy – only created when keys are present)
// ---------------------------------------------------------------------------
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

// Price IDs – set in .env on Render
const PRICE_IDS: Record<Exclude<PlanName, "free">, string | undefined> = {
  pro: process.env.STRIPE_PRO_PRICE_ID,
  business: process.env.STRIPE_BUSINESS_PRICE_ID,
};

// Map Stripe Price → PlanName
function planFromPriceId(priceId: string): PlanName {
  if (priceId === PRICE_IDS.pro) return "pro";
  if (priceId === PRICE_IDS.business) return "business";
  return "free";
}

function mapStatus(stripeStatus: string): SubscriptionStatus {
  if (stripeStatus === "active" || stripeStatus === "trialing") return "active";
  if (stripeStatus === "past_due") return "past_due";
  if (stripeStatus === "canceled" || stripeStatus === "unpaid" || stripeStatus === "incomplete_expired") return "canceled";
  return "none";
}

// ---------------------------------------------------------------------------
// Helper: get or create Stripe Customer for a user
// ---------------------------------------------------------------------------
async function ensureStripeCustomer(email: string): Promise<string> {
  const user = await storage.getUserByEmail(email);
  if (!user) throw new Error("User not found");
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    metadata: { userId: user.id ?? "" },
  });
  await storage.setStripeCustomerId(email, customer.id);
  return customer.id;
}

// ---------------------------------------------------------------------------
// Register Stripe routes
// ---------------------------------------------------------------------------
export function registerStripeRoutes(app: Express): void {
  // ---- Publishable key (public) -----------------------------------------
  app.get("/api/stripe/config", (_req, res) => {
    const pk = process.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "";
    res.json({ publishableKey: pk });
  });

  // ---- Create Checkout Session ------------------------------------------
  app.post("/api/stripe/checkout", async (req: Request, res: Response) => {
    try {
      const { email, plan } = req.body as { email?: string; plan?: string };
      if (!email || !plan) return res.status(400).json({ error: "email and plan required" });
      if (plan !== "pro" && plan !== "business") return res.status(400).json({ error: "Invalid plan" });

      const priceId = PRICE_IDS[plan];
      if (!priceId) return res.status(500).json({ error: `STRIPE_${plan.toUpperCase()}_PRICE_ID not configured` });

      const customerId = await ensureStripeCustomer(email);
      const stripe = getStripe();

      const baseUrl = process.env.FRONTEND_URL || req.headers.origin || "http://localhost:3000";
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${baseUrl}/pricing?success=true`,
        cancel_url: `${baseUrl}/pricing?canceled=true`,
        metadata: { plan },
      });

      res.json({ url: session.url });
    } catch (error) {
      log(`[stripe/checkout] ${error}`, "stripe");
      res.status(500).json({ error: "Failed to create checkout session", details: String(error) });
    }
  });

  // ---- Get current subscription -----------------------------------------
  app.get("/api/stripe/subscription", async (req: Request, res: Response) => {
    try {
      const email = (req.query.email as string) ?? "";
      if (!email) return res.status(400).json({ error: "email query param required" });
      const user = await storage.getUserByEmail(email.trim().toLowerCase());
      if (!user) return res.status(404).json({ error: "User not found" });

      res.json({
        plan: user.subscriptionPlan ?? "free",
        status: user.subscriptionStatus ?? "none",
        stripeSubscriptionId: user.stripeSubscriptionId ?? null,
      });
    } catch (error) {
      log(`[stripe/subscription] ${error}`, "stripe");
      res.status(500).json({ error: "Failed to get subscription" });
    }
  });

  // ---- Customer Portal --------------------------------------------------
  app.post("/api/stripe/portal", async (req: Request, res: Response) => {
    try {
      const { email } = req.body as { email?: string };
      if (!email) return res.status(400).json({ error: "email required" });
      const user = await storage.getUserByEmail(email.trim().toLowerCase());
      if (!user?.stripeCustomerId) return res.status(400).json({ error: "No Stripe customer found" });

      const stripe = getStripe();
      const baseUrl = process.env.FRONTEND_URL || req.headers.origin || "http://localhost:3000";
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${baseUrl}/pricing`,
      });
      res.json({ url: session.url });
    } catch (error) {
      log(`[stripe/portal] ${error}`, "stripe");
      res.status(500).json({ error: "Failed to create portal session" });
    }
  });

  // ---- Webhook ----------------------------------------------------------
  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    const stripe = getStripe();
    const sig = req.headers["stripe-signature"] as string | undefined;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      return res.status(400).json({ error: "Missing signature or webhook secret" });
    }

    let event: Stripe.Event;
    try {
      // rawBody is set by the express.json verify callback in app.ts
      const rawBody = req.rawBody as Buffer;
      if (!rawBody) return res.status(400).json({ error: "Missing raw body" });
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      log(`[stripe/webhook] Signature verification failed: ${err}`, "stripe");
      return res.status(400).json({ error: "Invalid signature" });
    }

    log(`[stripe/webhook] ${event.type}`, "stripe");

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.mode !== "subscription" || !session.customer || !session.subscription) break;

          const customerId = typeof session.customer === "string" ? session.customer : session.customer.id;
          const user = await storage.getUserByStripeCustomerId(customerId);
          if (!user) { log(`[stripe/webhook] User not found for customer ${customerId}`, "stripe"); break; }

          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = sub.items.data[0]?.price?.id ?? "";
          const plan = planFromPriceId(priceId);

          await storage.updateSubscription(user.email, {
            subscriptionPlan: plan,
            stripeSubscriptionId: sub.id,
            subscriptionStatus: mapStatus(sub.status),
          });
          log(`[stripe/webhook] ${user.email} → plan ${plan}`, "stripe");
          break;
        }

        case "customer.subscription.updated": {
          const sub = event.data.object as Stripe.Subscription;
          const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
          const user = await storage.getUserByStripeCustomerId(customerId);
          if (!user) break;

          const priceId = sub.items.data[0]?.price?.id ?? "";
          const plan = planFromPriceId(priceId);

          await storage.updateSubscription(user.email, {
            subscriptionPlan: plan,
            stripeSubscriptionId: sub.id,
            subscriptionStatus: mapStatus(sub.status),
          });
          log(`[stripe/webhook] subscription.updated ${user.email} → ${plan} (${sub.status})`, "stripe");
          break;
        }

        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
          const user = await storage.getUserByStripeCustomerId(customerId);
          if (!user) break;

          await storage.updateSubscription(user.email, {
            subscriptionPlan: "free",
            stripeSubscriptionId: null,
            subscriptionStatus: "canceled",
          });
          log(`[stripe/webhook] subscription.deleted ${user.email} → free`, "stripe");
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = typeof invoice.customer === "string" ? invoice.customer : (invoice.customer as Stripe.Customer)?.id;
          if (!customerId) break;
          const user = await storage.getUserByStripeCustomerId(customerId);
          if (!user) break;

          await storage.updateSubscription(user.email, {
            subscriptionPlan: user.subscriptionPlan as PlanName ?? "free",
            stripeSubscriptionId: user.stripeSubscriptionId ?? null,
            subscriptionStatus: "past_due",
          });
          log(`[stripe/webhook] payment_failed ${user.email}`, "stripe");
          break;
        }
      }
    } catch (err) {
      log(`[stripe/webhook] Handler error: ${err}`, "stripe");
    }

    res.json({ received: true });
  });
}
