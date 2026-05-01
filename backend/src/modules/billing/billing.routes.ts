import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/error";
import {
  createBillingPortalSession,
  createCheckoutSession,
  getBillingOverview
} from "./billing.service";

export const billingRouter = Router();

billingRouter.use(requireAuth);

billingRouter.get(
  "/subscription",
  asyncHandler(async (req, res) => {
    const overview = await getBillingOverview(req.auth!.userId);
    res.json(overview);
  })
);

billingRouter.post(
  "/checkout",
  asyncHandler(async (req, res) => {
    const payload = z.object({ plan: z.enum(["PRO", "ENTERPRISE"]) }).parse(req.body);
    const session = await createCheckoutSession({
      ownerId: req.auth!.userId,
      plan: payload.plan
    });
    res.status(201).json(session);
  })
);

billingRouter.post(
  "/portal",
  asyncHandler(async (req, res) => {
    const session = await createBillingPortalSession(req.auth!.userId);
    res.status(201).json(session);
  })
);
