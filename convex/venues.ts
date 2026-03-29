import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { sanitizeText } from "./lib/sanitize";

export const createVenue = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    address: v.string(),
    cityId: v.id("cities"),
    capacity: v.optional(v.number()),
  },
  handler: async (ctx, { clerkId, name, address, cityId, capacity }) => {
    const existing = await ctx.db
      .query("venues")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", clerkId))
      .unique();

    if (existing) {
      throw new Error("Venue profile already exists");
    }

    return await ctx.db.insert("venues", {
      ownerId: clerkId,
      name: sanitizeText(name, 200, "Venue name"),
      address: sanitizeText(address, 500, "Address"),
      cityId,
      capacity,
      createdAt: Date.now(),
    });
  },
});

export const updateVenue = mutation({
  args: {
    clerkId: v.string(),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    capacity: v.optional(v.number()),
  },
  handler: async (ctx, { clerkId, name, address, capacity }) => {
    const venue = await ctx.db
      .query("venues")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", clerkId))
      .unique();

    if (!venue) {
      throw new Error("Venue not found");
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = sanitizeText(name, 200, "Venue name");
    if (address !== undefined) updates.address = sanitizeText(address, 500, "Address");
    if (capacity !== undefined) updates.capacity = capacity;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(venue._id, updates);
    }
    return venue._id;
  },
});

export const getVenueByOwner = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("venues")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", clerkId))
      .unique();
  },
});

export const getVenuesByCityId = query({
  args: { cityId: v.id("cities") },
  handler: async (ctx, { cityId }) => {
    return await ctx.db
      .query("venues")
      .withIndex("by_cityId", (q) => q.eq("cityId", cityId))
      .collect();
  },
});
