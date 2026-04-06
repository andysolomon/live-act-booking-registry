import { describe, expect, test } from "vitest";
import { createTest } from "./setup";
import { api } from "../_generated/api";

async function seedFixture(t: ReturnType<typeof createTest>) {
  return await t.run(async (ctx) => {
    const cityId = await ctx.db.insert("cities", {
      name: "Austin",
      stateOrRegion: "TX",
      country: "US",
      isActive: true,
      createdAt: Date.now(),
    });

    // Performer user + profile
    await ctx.db.insert("users", {
      clerkId: "performer_1",
      role: "performer",
      cityId,
      createdAt: Date.now(),
    });
    const performerId = await ctx.db.insert("performers", {
      ownerId: "performer_1",
      stageName: "The Test Band",
      genres: ["Rock"],
      bio: "A test performer",
      cityId,
      createdAt: Date.now(),
    });
    // Weekly pattern: available every day
    for (let day = 0; day < 7; day++) {
      await ctx.db.insert("availabilityPatterns", {
        performerId,
        dayOfWeek: day,
        startTime: "18:00",
        endTime: "23:00",
      });
    }

    // Venue user + profile
    await ctx.db.insert("users", {
      clerkId: "venue_1",
      role: "venue_owner",
      cityId,
      createdAt: Date.now(),
    });
    const venueId = await ctx.db.insert("venues", {
      ownerId: "venue_1",
      name: "Test Venue",
      address: "123 Test St",
      cityId,
      createdAt: Date.now(),
    });

    return { cityId, performerId, venueId };
  });
}

describe("bookings", () => {
  test("createBookingRequest creates pending booking", async () => {
    const t = createTest();
    const { performerId, venueId } = await seedFixture(t);

    const bookingId = await t.mutation(api.bookings.createBookingRequest, {
      requestedBy: "venue_1",
      performerId,
      venueId,
      eventDate: "2026-05-10",
      offeredRateCents: 50000,
      startTime: "20:00",
      endTime: "23:00",
    });

    const booking = await t.query(api.bookings.getBookingById, { bookingId });
    expect(booking?.status).toBe("pending");
    expect(booking?.offeredRateCents).toBe(50000);
  });

  test("respondToBooking accept transitions to accepted", async () => {
    const t = createTest();
    const { performerId, venueId } = await seedFixture(t);

    const bookingId = await t.mutation(api.bookings.createBookingRequest, {
      requestedBy: "venue_1",
      performerId,
      venueId,
      eventDate: "2026-05-11",
      offeredRateCents: 50000,
      startTime: "20:00",
      endTime: "23:00",
    });

    await t.mutation(api.bookings.respondToBooking, {
      performerClerkId: "performer_1",
      bookingId,
      response: "accept",
    });

    const booking = await t.query(api.bookings.getBookingById, { bookingId });
    expect(booking?.status).toBe("accepted");
  });

  test("conflicting request on accepted date is rejected", async () => {
    const t = createTest();
    const { performerId, venueId } = await seedFixture(t);

    const firstId = await t.mutation(api.bookings.createBookingRequest, {
      requestedBy: "venue_1",
      performerId,
      venueId,
      eventDate: "2026-05-12",
      offeredRateCents: 50000,
      startTime: "20:00",
      endTime: "23:00",
    });
    await t.mutation(api.bookings.respondToBooking, {
      performerClerkId: "performer_1",
      bookingId: firstId,
      response: "accept",
    });

    await expect(
      t.mutation(api.bookings.createBookingRequest, {
        requestedBy: "venue_1",
        performerId,
        venueId,
        eventDate: "2026-05-12",
        offeredRateCents: 60000,
        startTime: "20:00",
        endTime: "23:00",
      }),
    ).rejects.toThrow();
  });

  test("invalid transition (pending -> completed) throws", async () => {
    const t = createTest();
    const { performerId, venueId } = await seedFixture(t);

    const bookingId = await t.mutation(api.bookings.createBookingRequest, {
      requestedBy: "venue_1",
      performerId,
      venueId,
      eventDate: "2026-05-13",
      offeredRateCents: 50000,
      startTime: "20:00",
      endTime: "23:00",
    });

    await expect(
      t.mutation(api.bookings.markCompleted, { bookingId }),
    ).rejects.toThrow();
  });

  test("cancelBooking records reason and canceledBy", async () => {
    const t = createTest();
    const { performerId, venueId } = await seedFixture(t);

    const bookingId = await t.mutation(api.bookings.createBookingRequest, {
      requestedBy: "venue_1",
      performerId,
      venueId,
      eventDate: "2026-05-14",
      offeredRateCents: 50000,
      startTime: "20:00",
      endTime: "23:00",
    });

    await t.mutation(api.bookings.cancelBooking, {
      bookingId,
      reason: "Event canceled",
      canceledBy: "venue",
    });

    const booking = await t.query(api.bookings.getBookingById, { bookingId });
    expect(booking?.status).toBe("canceled");
    expect(booking?.canceledBy).toBe("venue");
    expect(booking?.cancellationReason).toBe("Event canceled");
  });
});
