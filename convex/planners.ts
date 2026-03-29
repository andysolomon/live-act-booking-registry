import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createPlanner = mutation({
  args: {
    clerkId: v.string(),
    companyName: v.optional(v.string()),
    eventTypes: v.array(v.string()),
    cityId: v.id("cities"),
  },
  handler: async (ctx, { clerkId, companyName, eventTypes, cityId }) => {
    const existing = await ctx.db
      .query("planners")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", clerkId))
      .unique();

    if (existing) {
      throw new Error("Planner profile already exists");
    }

    return await ctx.db.insert("planners", {
      ownerId: clerkId,
      companyName: companyName?.trim() || undefined,
      eventTypes,
      cityId,
      createdAt: Date.now(),
    });
  },
});

export const getPlannerByOwner = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("planners")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", clerkId))
      .unique();
  },
});
