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

export const setCity = mutation({
  args: {
    clerkId: v.string(),
    cityId: v.id("cities"),
  },
  handler: async (ctx, { clerkId, cityId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const city = await ctx.db.get(cityId);
    if (!city || !city.isActive) {
      throw new Error("City not found or inactive");
    }

    await ctx.db.patch(user._id, { cityId });
    return user._id;
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const seedAdmin = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const existingAdmin = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (existingAdmin) {
      throw new Error("An admin already exists. Use setAdminRole instead.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (!user) {
      const id = await ctx.db.insert("users", {
        clerkId,
        role: "admin",
        createdAt: Date.now(),
      });
      return id;
    }

    await ctx.db.patch(user._id, { role: "admin" });
    return user._id;
  },
});

export const setAdminRole = mutation({
  args: {
    adminClerkId: v.string(),
    targetClerkId: v.string(),
    role: v.union(v.literal("admin"), v.literal("city_manager")),
    cityId: v.optional(v.id("cities")),
  },
  handler: async (ctx, { adminClerkId, targetClerkId, role, cityId }) => {
    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", adminClerkId))
      .unique();

    if (!admin || admin.role !== "admin") {
      throw new Error("Only super admins can assign admin roles");
    }

    if (role === "city_manager" && !cityId) {
      throw new Error("City manager requires a cityId");
    }

    if (cityId) {
      const city = await ctx.db.get(cityId);
      if (!city || !city.isActive) {
        throw new Error("City not found or inactive");
      }
    }

    const target = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", targetClerkId))
      .unique();

    if (!target) {
      throw new Error("Target user not found");
    }

    await ctx.db.patch(target._id, {
      role,
      ...(cityId ? { cityId } : {}),
    });
    return target._id;
  },
});

export const suspendUser = mutation({
  args: {
    adminClerkId: v.string(),
    targetClerkId: v.string(),
  },
  handler: async (ctx, { adminClerkId, targetClerkId }) => {
    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", adminClerkId))
      .unique();

    if (!admin || (admin.role !== "admin" && admin.role !== "city_manager")) {
      throw new Error("Only admins can suspend users");
    }

    const target = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", targetClerkId))
      .unique();

    if (!target) throw new Error("User not found");
    if (target.role === "admin") throw new Error("Cannot suspend an admin");

    await ctx.db.patch(target._id, { status: "suspended" });
    return target._id;
  },
});

export const unsuspendUser = mutation({
  args: {
    adminClerkId: v.string(),
    targetClerkId: v.string(),
  },
  handler: async (ctx, { adminClerkId, targetClerkId }) => {
    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", adminClerkId))
      .unique();

    if (!admin || (admin.role !== "admin" && admin.role !== "city_manager")) {
      throw new Error("Only admins can unsuspend users");
    }

    const target = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", targetClerkId))
      .unique();

    if (!target) throw new Error("User not found");

    await ctx.db.patch(target._id, { status: "active" });
    return target._id;
  },
});
