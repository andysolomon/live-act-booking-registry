import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { sanitizeText } from "./lib/sanitize";

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

    return await ctx.db.insert("performers", {
      ownerId: clerkId,
      stageName: sanitizeText(stageName, 200, "Stage name"),
      genres,
      baseRateCents,
      bio: sanitizeText(bio, 500, "Bio"),
      cityId,
      createdAt: Date.now(),
    });
  },
});

export const updatePerformer = mutation({
  args: {
    clerkId: v.string(),
    stageName: v.optional(v.string()),
    genres: v.optional(v.array(v.string())),
    baseRateCents: v.optional(v.number()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, stageName, genres, baseRateCents, bio }) => {
    const performer = await ctx.db
      .query("performers")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", clerkId))
      .unique();

    if (!performer) {
      throw new Error("Performer not found");
    }

    if (stageName !== undefined) {
      const trimmed = stageName.trim();
      if (trimmed.toLowerCase() !== performer.stageName.toLowerCase()) {
        const cityPerformers = await ctx.db
          .query("performers")
          .withIndex("by_cityId", (q) => q.eq("cityId", performer.cityId))
          .collect();

        const nameTaken = cityPerformers.some(
          (p) =>
            p._id !== performer._id &&
            p.stageName.toLowerCase() === trimmed.toLowerCase(),
        );

        if (nameTaken) {
          throw new Error(
            `Stage name "${stageName}" is already taken in this city`,
          );
        }
      }
    }

    const updates: Record<string, unknown> = {};
    if (stageName !== undefined) updates.stageName = sanitizeText(stageName, 200, "Stage name");
    if (genres !== undefined) updates.genres = genres;
    if (baseRateCents !== undefined) updates.baseRateCents = baseRateCents;
    if (bio !== undefined) updates.bio = sanitizeText(bio, 500, "Bio");

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(performer._id, updates);
    }
    return performer._id;
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
