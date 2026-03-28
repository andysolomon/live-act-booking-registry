import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const requestCity = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    stateOrRegion: v.string(),
    country: v.string(),
  },
  handler: async (ctx, { clerkId, name, stateOrRegion, country }) => {
    const normalizedName = name.trim().toLowerCase();
    const normalizedState = stateOrRegion.trim().toLowerCase();

    // Check existing cities
    const allCities = await ctx.db.query("cities").collect();
    const existingCity = allCities.find(
      (c) =>
        c.name.toLowerCase() === normalizedName &&
        c.stateOrRegion.toLowerCase() === normalizedState,
    );
    if (existingCity) {
      throw new Error(
        `${name}, ${stateOrRegion} already exists as an active city`,
      );
    }

    // Check pending requests
    const pendingRequests = await ctx.db
      .query("cityRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    const existingRequest = pendingRequests.find(
      (r) =>
        r.name.toLowerCase() === normalizedName &&
        r.stateOrRegion.toLowerCase() === normalizedState,
    );
    if (existingRequest) {
      throw new Error(
        `${name}, ${stateOrRegion} has already been requested and is pending review`,
      );
    }

    return await ctx.db.insert("cityRequests", {
      name: name.trim(),
      stateOrRegion: stateOrRegion.trim().toUpperCase(),
      country: country.trim().toUpperCase(),
      requestedBy: clerkId,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const getPendingRequests = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("cityRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
  },
});

export const getMyRequests = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const all = await ctx.db.query("cityRequests").collect();
    return all.filter((r) => r.requestedBy === clerkId);
  },
});
