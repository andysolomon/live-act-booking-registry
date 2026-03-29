import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
      name: name.trim(),
      address: address.trim(),
      cityId,
      capacity,
      createdAt: Date.now(),
    });
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
