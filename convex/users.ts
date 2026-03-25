import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();
  },
});

export const createUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId,
      createdAt: Date.now(),
    });
  },
});

export const setRole = mutation({
  args: {
    clerkId: v.string(),
    role: v.union(
      v.literal("venue_owner"),
      v.literal("performer"),
      v.literal("planner"),
    ),
  },
  handler: async (ctx, { clerkId, role }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (!user) {
      const id = await ctx.db.insert("users", {
        clerkId,
        role,
        createdAt: Date.now(),
      });
      return id;
    }

    if (user.role) {
      throw new Error("Role already set and cannot be changed");
    }

    await ctx.db.patch(user._id, { role });
    return user._id;
  },
});
