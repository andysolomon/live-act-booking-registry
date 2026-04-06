import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { sanitizeText } from "./lib/sanitize";

// --- Helpers ---

async function notify(
  ctx: MutationCtx,
  userId: string,
  type: string,
  message: string,
  relatedId?: string,
) {
  await ctx.db.insert("notifications", {
    userId,
    type,
    message,
    read: false,
    relatedId,
    createdAt: Date.now(),
  });
}

// --- Mutations ---

export const createBookingRequest = mutation({
  args: {
    requestedBy: v.string(),
    performerId: v.id("performers"),
    venueId: v.id("venues"),
    eventDate: v.string(),
    offeredRateCents: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const performer = await ctx.db.get(args.performerId);
    if (!performer) throw new Error("Performer not found");

    const venue = await ctx.db.get(args.venueId);
    if (!venue) throw new Error("Venue not found");

    // Check for existing accepted bookings on this date
    const existingBookings = await ctx.db
      .query("bookings")
      .withIndex("by_performerId", (q) =>
        q.eq("performerId", args.performerId),
      )
      .collect();

    const hasConflict = existingBookings.some(
      (b) =>
        b.eventDate === args.eventDate &&
        (b.status === "accepted" || b.status === "in_progress"),
    );

    if (hasConflict) {
      throw new Error("Performer already has a booking on this date");
    }

    const now = Date.now();
    const bookingId = await ctx.db.insert("bookings", {
      venueId: args.venueId,
      performerId: args.performerId,
      requestedBy: args.requestedBy,
      eventDate: args.eventDate,
      offeredRateCents: args.offeredRateCents,
      startTime: args.startTime,
      endTime: args.endTime,
      description: args.description
        ? sanitizeText(args.description, 500, "Description")
        : undefined,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    // Notify the performer of the new booking request
    await notify(
      ctx,
      performer.ownerId,
      "booking_request",
      `New booking request at ${venue.name} for ${args.eventDate}`,
      bookingId,
    );

    return bookingId;
  },
});

export const respondToBooking = mutation({
  args: {
    performerClerkId: v.string(),
    bookingId: v.id("bookings"),
    response: v.union(v.literal("accept"), v.literal("decline")),
  },
  handler: async (ctx, { performerClerkId, bookingId, response }) => {
    const booking = await ctx.db.get(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.status !== "pending") {
      throw new Error("Can only respond to pending bookings");
    }

    const performer = await ctx.db.get(booking.performerId);
    if (!performer || performer.ownerId !== performerClerkId) {
      throw new Error("Not authorized to respond to this booking");
    }

    const now = Date.now();

    if (response === "accept") {
      await ctx.db.patch(bookingId, {
        status: "accepted",
        updatedAt: now,
      });

      await notify(
        ctx,
        booking.requestedBy,
        "booking_accepted",
        `Your booking request for ${booking.eventDate} was accepted`,
        bookingId,
      );

      // Auto-decline conflicting pending requests on the same date
      const pendingBookings = await ctx.db
        .query("bookings")
        .withIndex("by_performerId", (q) =>
          q.eq("performerId", booking.performerId),
        )
        .collect();

      for (const other of pendingBookings) {
        if (
          other._id !== bookingId &&
          other.eventDate === booking.eventDate &&
          other.status === "pending"
        ) {
          await ctx.db.patch(other._id, {
            status: "declined",
            updatedAt: now,
          });
          await notify(
            ctx,
            other.requestedBy,
            "booking_declined",
            `Your booking for ${other.eventDate} was declined (performer booked another gig)`,
            other._id,
          );
        }
      }
    } else {
      await ctx.db.patch(bookingId, {
        status: "declined",
        updatedAt: now,
      });
      await notify(
        ctx,
        booking.requestedBy,
        "booking_declined",
        `Your booking request for ${booking.eventDate} was declined`,
        bookingId,
      );
    }

    return bookingId;
  },
});

export const cancelBooking = mutation({
  args: {
    bookingId: v.id("bookings"),
    reason: v.string(),
    canceledBy: v.union(
      v.literal("venue"),
      v.literal("performer"),
      v.literal("planner"),
    ),
  },
  handler: async (ctx, { bookingId, reason, canceledBy }) => {
    const booking = await ctx.db.get(bookingId);
    if (!booking) throw new Error("Booking not found");

    if (
      booking.status !== "pending" &&
      booking.status !== "accepted" &&
      booking.status !== "in_progress"
    ) {
      throw new Error("Cannot cancel a booking in this state");
    }

    await ctx.db.patch(bookingId, {
      status: "canceled",
      canceledBy,
      cancellationReason: sanitizeText(reason, 500, "Cancellation reason"),
      updatedAt: Date.now(),
    });

    // Notify the other party
    const performer = await ctx.db.get(booking.performerId);
    const otherPartyUserId =
      canceledBy === "performer" ? booking.requestedBy : performer?.ownerId;
    if (otherPartyUserId) {
      await notify(
        ctx,
        otherPartyUserId,
        "booking_canceled",
        `Booking for ${booking.eventDate} was canceled: ${reason}`,
        bookingId,
      );
    }

    return bookingId;
  },
});

export const markInProgress = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    const booking = await ctx.db.get(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.status !== "accepted") {
      throw new Error("Can only mark accepted bookings as in progress");
    }

    await ctx.db.patch(bookingId, {
      status: "in_progress",
      updatedAt: Date.now(),
    });
  },
});

export const markCompleted = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    const booking = await ctx.db.get(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.status !== "in_progress") {
      throw new Error("Can only complete bookings that are in progress");
    }

    await ctx.db.patch(bookingId, {
      status: "completed",
      updatedAt: Date.now(),
    });

    const performer = await ctx.db.get(booking.performerId);
    if (performer) {
      await notify(
        ctx,
        performer.ownerId,
        "booking_completed",
        `Booking for ${booking.eventDate} marked as completed`,
        bookingId,
      );
    }
    await notify(
      ctx,
      booking.requestedBy,
      "booking_completed",
      `Booking for ${booking.eventDate} marked as completed`,
      bookingId,
    );
  },
});

// --- Queries ---

export const getBookingsForPerformer = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const performer = await ctx.db
      .query("performers")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", clerkId))
      .unique();

    if (!performer) return [];

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_performerId", (q) =>
        q.eq("performerId", performer._id),
      )
      .collect();

    // Enrich with venue details
    const enriched = await Promise.all(
      bookings.map(async (b) => {
        const venue = await ctx.db.get(b.venueId);
        return { ...b, venueName: venue?.name ?? "Unknown" };
      }),
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getBookingsForVenue = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const venue = await ctx.db
      .query("venues")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", clerkId))
      .unique();

    if (!venue) return [];

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_venueId", (q) => q.eq("venueId", venue._id))
      .collect();

    const enriched = await Promise.all(
      bookings.map(async (b) => {
        const performer = await ctx.db.get(b.performerId);
        return {
          ...b,
          performerName: performer?.stageName ?? "Unknown",
        };
      }),
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getBookingsForRequester = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_requestedBy", (q) => q.eq("requestedBy", clerkId))
      .collect();

    const enriched = await Promise.all(
      bookings.map(async (b) => {
        const performer = await ctx.db.get(b.performerId);
        const venue = await ctx.db.get(b.venueId);
        return {
          ...b,
          performerName: performer?.stageName ?? "Unknown",
          venueName: venue?.name ?? "Unknown",
        };
      }),
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getBookingById = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    const booking = await ctx.db.get(bookingId);
    if (!booking) return null;

    const performer = await ctx.db.get(booking.performerId);
    const venue = await ctx.db.get(booking.venueId);

    return {
      ...booking,
      performerName: performer?.stageName ?? "Unknown",
      venueName: venue?.name ?? "Unknown",
    };
  },
});
