import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createPerformer = mutation({
  args: {
    clerkId: v.string(),
    stageName: v.string(),
    genres: v.array(v.string()),
    baseRateCents: v.optional(v.number()),
    bio: v.string(),
    cityId: v.id("cities"),
  },
  handler: async (ctx, { clerkId, stageName, genres, baseRateCents, bio, cityId }) => {
    const existing = await ctx.db
      .query("performers")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", clerkId))
      .unique();

    if (existing) {
      throw new Error("Performer profile already exists");
    }

    // Check stage name uniqueness within city
    const cityPerformers = await ctx.db
      .query("performers")
      .withIndex("by_cityId", (q) => q.eq("cityId", cityId))
      .collect();

    const nameTaken = cityPerformers.some(
      (p) => p.stageName.toLowerCase() === stageName.trim().toLowerCase(),
    );

    if (nameTaken) {
      throw new Error(`Stage name "${stageName}" is already taken in this city`);
    }

    if (bio.length > 500) {
      throw new Error("Bio must be 500 characters or fewer");
    }

    return await ctx.db.insert("performers", {
      ownerId: clerkId,
      stageName: stageName.trim(),
      genres,
      baseRateCents,
      bio: bio.trim(),
      cityId,
      createdAt: Date.now(),
    });
  },
});

export const getPerformerByOwner = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("performers")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", clerkId))
      .unique();
  },
});

export const getPerformersByCityId = query({
  args: { cityId: v.id("cities") },
  handler: async (ctx, { cityId }) => {
    return await ctx.db
      .query("performers")
      .withIndex("by_cityId", (q) => q.eq("cityId", cityId))
      .collect();
  },
});
