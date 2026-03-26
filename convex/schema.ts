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
    createdAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),

  cities: defineTable({
    name: v.string(),
    stateOrRegion: v.string(),
    country: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_isActive", ["isActive"]),
});
