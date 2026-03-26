import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getActiveCities = query({
  args: {},
  handler: async (ctx) => {
    const cities = await ctx.db
      .query("cities")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    return cities.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getCityById = query({
  args: { cityId: v.id("cities") },
  handler: async (ctx, { cityId }) => {
    return await ctx.db.get(cityId);
  },
});

const SEED_CITIES = [
  { name: "Austin", stateOrRegion: "TX", country: "US" },
  { name: "Nashville", stateOrRegion: "TN", country: "US" },
  { name: "Brooklyn", stateOrRegion: "NY", country: "US" },
  { name: "Portland", stateOrRegion: "OR", country: "US" },
  { name: "Chicago", stateOrRegion: "IL", country: "US" },
];

export const seedCities = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("cities").first();
    if (existing) {
      return { seeded: false, message: "Cities already exist" };
    }

    const now = Date.now();
    for (const city of SEED_CITIES) {
      await ctx.db.insert("cities", {
        ...city,
        isActive: true,
        createdAt: now,
      });
    }

    return { seeded: true, message: `Seeded ${SEED_CITIES.length} cities` };
  },
});
