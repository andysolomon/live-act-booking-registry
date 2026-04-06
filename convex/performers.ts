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

export const getPerformerById = query({
  args: { performerId: v.id("performers") },
  handler: async (ctx, { performerId }) => {
    return await ctx.db.get(performerId);
  },
});

export const searchPerformers = query({
  args: {
    cityId: v.id("cities"),
    genres: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { cityId, genres }) => {
    let performers = await ctx.db
      .query("performers")
      .withIndex("by_cityId", (q) => q.eq("cityId", cityId))
      .collect();

    // Filter by genres if specified
    if (genres && genres.length > 0) {
      performers = performers.filter((p) =>
        genres.some((g) => p.genres.includes(g)),
      );
    }

    // Filter out suspended users
    const enriched = await Promise.all(
      performers.map(async (p) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", p.ownerId))
          .unique();
        return { ...p, isSuspended: user?.status === "suspended" };
      }),
    );

    return enriched.filter((p) => !p.isSuspended);
  },
});
