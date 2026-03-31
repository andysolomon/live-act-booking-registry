import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// --- Mutations ---

export const setRecurringPatterns = mutation({
  args: {
    performerClerkId: v.string(),
    patterns: v.array(
      v.object({
        dayOfWeek: v.number(),
        startTime: v.string(),
        endTime: v.string(),
      }),
    ),
  },
  handler: async (ctx, { performerClerkId, patterns }) => {
    const performer = await ctx.db
      .query("performers")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", performerClerkId))
      .unique();

    if (!performer) throw new Error("Performer not found");

    // Delete existing patterns
    const existing = await ctx.db
      .query("availabilityPatterns")
      .withIndex("by_performerId", (q) => q.eq("performerId", performer._id))
      .collect();

    for (const pattern of existing) {
      await ctx.db.delete(pattern._id);
    }

    // Insert new patterns
    for (const p of patterns) {
      if (p.dayOfWeek < 0 || p.dayOfWeek > 6) {
        throw new Error("dayOfWeek must be 0-6");
      }
      await ctx.db.insert("availabilityPatterns", {
        performerId: performer._id,
        dayOfWeek: p.dayOfWeek,
        startTime: p.startTime,
        endTime: p.endTime,
      });
    }

    return { updated: patterns.length };
  },
});

export const addOverride = mutation({
  args: {
    performerClerkId: v.string(),
    date: v.string(),
    type: v.union(v.literal("block"), v.literal("available")),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
  },
  handler: async (ctx, { performerClerkId, date, type, startTime, endTime }) => {
    const performer = await ctx.db
      .query("performers")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", performerClerkId))
      .unique();

    if (!performer) throw new Error("Performer not found");

    // Remove existing override for this date if any
    const existing = await ctx.db
      .query("availabilityOverrides")
      .withIndex("by_performerId", (q) => q.eq("performerId", performer._id))
      .collect();

    const existingForDate = existing.find((o) => o.date === date);
    if (existingForDate) {
      await ctx.db.delete(existingForDate._id);
    }

    return await ctx.db.insert("availabilityOverrides", {
      performerId: performer._id,
      date,
      type,
      startTime,
      endTime,
    });
  },
});

export const removeOverride = mutation({
  args: {
    performerClerkId: v.string(),
    overrideId: v.id("availabilityOverrides"),
  },
  handler: async (ctx, { performerClerkId, overrideId }) => {
    const performer = await ctx.db
      .query("performers")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", performerClerkId))
      .unique();

    if (!performer) throw new Error("Performer not found");

    const override = await ctx.db.get(overrideId);
    if (!override || override.performerId !== performer._id) {
      throw new Error("Override not found");
    }

    await ctx.db.delete(overrideId);
  },
});

// --- Queries ---

export const getAvailabilityForPerformer = query({
  args: { performerId: v.id("performers") },
  handler: async (ctx, { performerId }) => {
    const patterns = await ctx.db
      .query("availabilityPatterns")
      .withIndex("by_performerId", (q) => q.eq("performerId", performerId))
      .collect();

    const overrides = await ctx.db
      .query("availabilityOverrides")
      .withIndex("by_performerId", (q) => q.eq("performerId", performerId))
      .collect();

    return { patterns, overrides };
  },
});

export const getComputedAvailability = query({
  args: {
    performerId: v.id("performers"),
    startDate: v.string(),
    days: v.number(),
  },
  handler: async (ctx, { performerId, startDate, days }) => {
    const patterns = await ctx.db
      .query("availabilityPatterns")
      .withIndex("by_performerId", (q) => q.eq("performerId", performerId))
      .collect();

    const overrides = await ctx.db
      .query("availabilityOverrides")
      .withIndex("by_performerId", (q) => q.eq("performerId", performerId))
      .collect();

    const overrideMap = new Map(overrides.map((o) => [o.date, o]));

    const calendar: {
      date: string;
      dayOfWeek: number;
      status: "available" | "unavailable" | "blocked";
      startTime?: string;
      endTime?: string;
    }[] = [];

    const start = new Date(startDate + "T00:00:00");

    for (let i = 0; i < days; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const dateStr = current.toISOString().split("T")[0];
      const dayOfWeek = current.getDay();

      const override = overrideMap.get(dateStr);

      if (override) {
        calendar.push({
          date: dateStr,
          dayOfWeek,
          status: override.type === "block" ? "blocked" : "available",
          startTime: override.startTime ?? undefined,
          endTime: override.endTime ?? undefined,
        });
      } else {
        const matchingPattern = patterns.find((p) => p.dayOfWeek === dayOfWeek);
        if (matchingPattern) {
          calendar.push({
            date: dateStr,
            dayOfWeek,
            status: "available",
            startTime: matchingPattern.startTime,
            endTime: matchingPattern.endTime,
          });
        } else {
          calendar.push({
            date: dateStr,
            dayOfWeek,
            status: "unavailable",
          });
        }
      }
    }

    return calendar;
  },
});

export const isPerformerAvailable = query({
  args: {
    performerId: v.id("performers"),
    date: v.string(),
  },
  handler: async (ctx, { performerId, date }) => {
    // Check overrides first
    const overrides = await ctx.db
      .query("availabilityOverrides")
      .withIndex("by_performerId", (q) => q.eq("performerId", performerId))
      .collect();

    const override = overrides.find((o) => o.date === date);
    if (override) {
      if (override.type === "block") {
        return { available: false, reason: "Date is blocked by performer" };
      }
      return { available: true, reason: "Special availability" };
    }

    // Check recurring pattern
    const dateObj = new Date(date + "T00:00:00");
    const dayOfWeek = dateObj.getDay();

    const patterns = await ctx.db
      .query("availabilityPatterns")
      .withIndex("by_performerId", (q) => q.eq("performerId", performerId))
      .collect();

    const hasPattern = patterns.some((p) => p.dayOfWeek === dayOfWeek);
    if (!hasPattern) {
      return { available: false, reason: "Performer is not available on this day" };
    }

    // Check existing accepted bookings (table doesn't exist yet — will be added in Batch 2)
    // For now, just check availability patterns
    return { available: true, reason: "Available" };
  },
});
