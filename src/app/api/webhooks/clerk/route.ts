import { Webhook } from "svix";
import { headers } from "next/headers";
import type { WebhookEvent } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!CLERK_WEBHOOK_SECRET) {
    throw new Error("CLERK_WEBHOOK_SECRET is not set");
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(CLERK_WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    console.error("Webhook signature verification failed");
    return new Response("Invalid signature", { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name } = evt.data;
    console.log(`[clerk-webhook] user.created: ${id}`, {
      email: email_addresses[0]?.email_address,
      firstName: first_name,
      lastName: last_name,
    });
    // TODO: Create Convex user record (W-000005)
  }

  if (eventType === "user.updated") {
    console.log(`[clerk-webhook] user.updated: ${evt.data.id}`);
    // TODO: Update Convex user record (W-000005)
  }

  if (eventType === "user.deleted") {
    console.log(`[clerk-webhook] user.deleted: ${evt.data.id}`);
    // TODO: Soft-delete Convex user record (W-000005)
  }

  return new Response("OK", { status: 200 });
}
