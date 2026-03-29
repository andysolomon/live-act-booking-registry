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

export const approveCity = mutation({
  args: {
    adminClerkId: v.string(),
    requestId: v.id("cityRequests"),
  },
  handler: async (ctx, { adminClerkId, requestId }) => {
    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", adminClerkId))
      .unique();

    if (!admin || (admin.role !== "admin" && admin.role !== "city_manager")) {
      throw new Error("Only admins can approve city requests");
    }

    const request = await ctx.db.get(requestId);
    if (!request || request.status !== "pending") {
      throw new Error("Request not found or already processed");
    }

    await ctx.db.insert("cities", {
      name: request.name,
      stateOrRegion: request.stateOrRegion,
      country: request.country,
      isActive: true,
      createdAt: Date.now(),
    });

    await ctx.db.patch(requestId, { status: "approved" });
    return requestId;
  },
});

export const rejectCity = mutation({
  args: {
    adminClerkId: v.string(),
    requestId: v.id("cityRequests"),
    rejectionReason: v.string(),
  },
  handler: async (ctx, { adminClerkId, requestId, rejectionReason }) => {
    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", adminClerkId))
      .unique();

    if (!admin || (admin.role !== "admin" && admin.role !== "city_manager")) {
      throw new Error("Only admins can reject city requests");
    }

    const request = await ctx.db.get(requestId);
    if (!request || request.status !== "pending") {
      throw new Error("Request not found or already processed");
    }

    await ctx.db.patch(requestId, {
      status: "rejected",
      rejectionReason,
    });
    return requestId;
  },
});

export const getMyRequests = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const all = await ctx.db.query("cityRequests").collect();
    return all.filter((r) => r.requestedBy === clerkId);
  },
});
