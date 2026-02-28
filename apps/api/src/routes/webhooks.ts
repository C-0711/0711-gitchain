/**
 * Webhook management routes
 */

import { Router } from "express";
import type { Router as IRouter } from "express";
import crypto from "crypto";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";

const router: IRouter = Router();

interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  enabled: boolean;
  createdAt: Date;
}

// In-memory store
const webhooks = new Map<string, Webhook[]>();

const VALID_EVENTS = [
  "container.created",
  "container.updated",
  "container.deleted",
  "batch.registered",
  "namespace.created",
];

/**
 * GET /webhooks - List webhooks
 */
router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userWebhooks = webhooks.get(req.user!.id) || [];
  res.json({
    webhooks: userWebhooks.map((w) => ({
      id: w.id,
      url: w.url,
      events: w.events,
      enabled: w.enabled,
      createdAt: w.createdAt,
    })),
  });
});

/**
 * POST /webhooks - Create webhook
 */
router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { url, events } = req.body;

    if (!url || !events?.length) {
      return res.status(400).json({ error: "url and events required" });
    }

    const invalidEvents = events.filter((e: string) => !VALID_EVENTS.includes(e));
    if (invalidEvents.length) {
      return res.status(400).json({ error: `Invalid events: ${invalidEvents.join(", ")}` });
    }

    const webhook: Webhook = {
      id: crypto.randomUUID(),
      url,
      events,
      secret: crypto.randomBytes(32).toString("hex"),
      enabled: true,
      createdAt: new Date(),
    };

    const userWebhooks = webhooks.get(req.user!.id) || [];
    userWebhooks.push(webhook);
    webhooks.set(req.user!.id, userWebhooks);

    res.status(201).json({
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      secret: webhook.secret,
      message: "Webhook created",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /webhooks/:id - Delete webhook
 */
router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userWebhooks = webhooks.get(req.user!.id) || [];
  const index = userWebhooks.findIndex((w) => w.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: "Webhook not found" });
  }

  userWebhooks.splice(index, 1);
  webhooks.set(req.user!.id, userWebhooks);

  res.json({ message: "Webhook deleted" });
});

/**
 * Dispatch webhook event
 */
export async function dispatchWebhook(
  userId: string,
  event: string,
  payload: unknown
): Promise<void> {
  const userWebhooks = webhooks.get(userId) || [];

  for (const webhook of userWebhooks) {
    if (!webhook.enabled || !webhook.events.includes(event)) continue;

    const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    const signature = crypto.createHmac("sha256", webhook.secret).update(body).digest("hex");

    try {
      await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-GitChain-Signature": signature,
        },
        body,
      });
    } catch {
      // Log failed webhook delivery
    }
  }
}

export default router;
