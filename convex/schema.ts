import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    role: v.optional(
      v.union(
        v.literal("venue_owner"),
        v.literal("performer"),
        v.literal("planner"),
        v.literal("admin"),
        v.literal("city_manager"),
      ),
    ),
    cityId: v.optional(v.id("cities")),
    status: v.optional(
      v.union(v.literal("active"), v.literal("suspended")),
    ),
    createdAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),

  cityRequests: defineTable({
    name: v.string(),
    stateOrRegion: v.string(),
    country: v.string(),
    requestedBy: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    rejectionReason: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_status", ["status"]),

  cities: defineTable({
    name: v.string(),
    stateOrRegion: v.string(),
    country: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_isActive", ["isActive"]),

  venues: defineTable({
    ownerId: v.string(),
    name: v.string(),
    address: v.string(),
    cityId: v.id("cities"),
    capacity: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_cityId", ["cityId"]),

  performers: defineTable({
    ownerId: v.string(),
    stageName: v.string(),
    genres: v.array(v.string()),
    baseRateCents: v.optional(v.number()),
    bio: v.string(),
    cityId: v.id("cities"),
    createdAt: v.number(),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_cityId", ["cityId"]),

  availabilityPatterns: defineTable({
    performerId: v.id("performers"),
    dayOfWeek: v.number(), // 0 = Sunday, 6 = Saturday
    startTime: v.string(), // HH:MM
    endTime: v.string(), // HH:MM
  }).index("by_performerId", ["performerId"]),

  availabilityOverrides: defineTable({
    performerId: v.id("performers"),
    date: v.string(), // YYYY-MM-DD
    type: v.union(v.literal("block"), v.literal("available")),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
  }).index("by_performerId", ["performerId"]),

  planners: defineTable({
    ownerId: v.string(),
    companyName: v.optional(v.string()),
    eventTypes: v.array(v.string()),
    cityId: v.id("cities"),
    createdAt: v.number(),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_cityId", ["cityId"]),
});
