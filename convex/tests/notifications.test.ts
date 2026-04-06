import { describe, expect, test } from "vitest";
import { createTest } from "./setup";
import { api } from "../_generated/api";

describe("notifications", () => {
  test("getUnreadCount returns 0 when no notifications", async () => {
    const t = createTest();
    const count = await t.query(api.notifications.getUnreadCount, {
      clerkId: "user_no_notifs",
    });
    expect(count).toBe(0);
  });

  test("booking request creates notification for performer", async () => {
    const t = createTest();

    const { performerId, venueId } = await t.run(async (ctx) => {
      const cityId = await ctx.db.insert("cities", {
        name: "Brooklyn",
        stateOrRegion: "NY",
        country: "US",
        isActive: true,
        createdAt: Date.now(),
      });
      await ctx.db.insert("users", {
        clerkId: "notif_performer",
        role: "performer",
        cityId,
        createdAt: Date.now(),
      });
      const performerId = await ctx.db.insert("performers", {
        ownerId: "notif_performer",
        stageName: "Notif Act",
        genres: ["Rock"],
        bio: "Test",
        cityId,
        createdAt: Date.now(),
      });
      await ctx.db.insert("availabilityPatterns", {
        performerId,
        dayOfWeek: 5,
        startTime: "20:00",
        endTime: "23:00",
      });
      await ctx.db.insert("users", {
        clerkId: "notif_venue",
        role: "venue_owner",
        cityId,
        createdAt: Date.now(),
      });
      const venueId = await ctx.db.insert("venues", {
        ownerId: "notif_venue",
        name: "Notif Venue",
        address: "1 Test Rd",
        cityId,
        createdAt: Date.now(),
      });
      return { performerId, venueId };
    });

    await t.mutation(api.bookings.createBookingRequest, {
      requestedBy: "notif_venue",
      performerId,
      venueId,
      eventDate: "2026-06-05",
      offeredRateCents: 50000,
      startTime: "20:00",
      endTime: "23:00",
    });

    const count = await t.query(api.notifications.getUnreadCount, {
      clerkId: "notif_performer",
    });
    expect(count).toBe(1);

    const notifications = await t.query(api.notifications.getNotifications, {
      clerkId: "notif_performer",
    });
    expect(notifications[0].type).toBe("booking_request");
  });

  test("markAsRead decreases unread count", async () => {
    const t = createTest();

    const notificationId = await t.run(async (ctx) => {
      return await ctx.db.insert("notifications", {
        userId: "read_user",
        type: "test",
        message: "Test notification",
        read: false,
        createdAt: Date.now(),
      });
    });

    expect(
      await t.query(api.notifications.getUnreadCount, { clerkId: "read_user" }),
    ).toBe(1);

    await t.mutation(api.notifications.markAsRead, { notificationId });

    expect(
      await t.query(api.notifications.getUnreadCount, { clerkId: "read_user" }),
    ).toBe(0);
  });
});
