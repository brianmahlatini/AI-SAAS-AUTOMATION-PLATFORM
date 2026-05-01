import type { Request, Response } from "express";
import { handleStripeWebhook } from "./billing.service";

export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  const result = await handleStripeWebhook(req.headers["stripe-signature"] as string | undefined, req.body);
  res.json(result);
}
