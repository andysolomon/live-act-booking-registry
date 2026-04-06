import { describe, expect, test } from "vitest";
import { createTest } from "./setup";
import { api } from "../_generated/api";

describe("performers queries", () => {
  test("getPerformersByCityId returns only city-scoped performers", async () => {
    const t = createTest();

    const { austinId, nashvilleId } = await t.run(async (ctx) => {
      const austinId = await ctx.db.insert("cities", {
        name: "Austin",
        stateOrRegion: "TX",
        country: "US",
        isActive: true,
        createdAt: Date.now(),
      });
      const nashvilleId = await ctx.db.insert("cities", {
        name: "Nashville",
        stateOrRegion: "TN",
        country: "US",
        isActive: true,
        createdAt: Date.now(),
      });
      await ctx.db.insert("users", {
        clerkId: "p_austin",
        role: "performer",
        cityId: austinId,
        createdAt: Date.now(),
      });
      await ctx.db.insert("performers", {
        ownerId: "p_austin",
        stageName: "Austin Act",
        genres: ["Rock"],
        bio: "Austin",
        cityId: austinId,
        createdAt: Date.now(),
      });
      await ctx.db.insert("users", {
        clerkId: "p_nashville",
        role: "performer",
        cityId: nashvilleId,
        createdAt: Date.now(),
      });
      await ctx.db.insert("performers", {
        ownerId: "p_nashville",
        stageName: "Nashville Act",
        genres: ["Country"],
        bio: "Nashville",
        cityId: nashvilleId,
        createdAt: Date.now(),
      });
      return { austinId, nashvilleId };
    });

    const austin = await t.query(api.performers.getPerformersByCityId, {
      cityId: austinId,
    });
    const nashville = await t.query(api.performers.getPerformersByCityId, {
      cityId: nashvilleId,
    });

    expect(austin).toHaveLength(1);
    expect(austin[0].stageName).toBe("Austin Act");
    expect(nashville).toHaveLength(1);
    expect(nashville[0].stageName).toBe("Nashville Act");
  });

  test("searchPerformers filters by genre", async () => {
    const t = createTest();

    const { cityId } = await t.run(async (ctx) => {
      const cityId = await ctx.db.insert("cities", {
        name: "Chicago",
        stateOrRegion: "IL",
        country: "US",
        isActive: true,
        createdAt: Date.now(),
      });
      await ctx.db.insert("users", {
        clerkId: "p_rock",
        role: "performer",
        cityId,
        createdAt: Date.now(),
      });
      await ctx.db.insert("performers", {
        ownerId: "p_rock",
        stageName: "Rock Band",
        genres: ["Rock"],
        bio: "Rock",
        cityId,
        createdAt: Date.now(),
      });
      await ctx.db.insert("users", {
        clerkId: "p_jazz",
        role: "performer",
        cityId,
        createdAt: Date.now(),
      });
      await ctx.db.insert("performers", {
        ownerId: "p_jazz",
        stageName: "Jazz Band",
        genres: ["Jazz"],
        bio: "Jazz",
        cityId,
        createdAt: Date.now(),
      });
      return { cityId };
    });

    const jazzResults = await t.query(api.performers.searchPerformers, {
      cityId,
      genres: ["Jazz"],
    });
    expect(jazzResults).toHaveLength(1);
    expect(jazzResults[0].stageName).toBe("Jazz Band");
  });

  test("searchPerformers excludes suspended users", async () => {
    const t = createTest();

    const { cityId } = await t.run(async (ctx) => {
      const cityId = await ctx.db.insert("cities", {
        name: "Portland",
        stateOrRegion: "OR",
        country: "US",
        isActive: true,
        createdAt: Date.now(),
      });
      await ctx.db.insert("users", {
        clerkId: "p_active",
        role: "performer",
        cityId,
        status: "active",
        createdAt: Date.now(),
      });
      await ctx.db.insert("performers", {
        ownerId: "p_active",
        stageName: "Active Act",
        genres: ["Folk"],
        bio: "Active",
        cityId,
        createdAt: Date.now(),
      });
      await ctx.db.insert("users", {
        clerkId: "p_suspended",
        role: "performer",
        cityId,
        status: "suspended",
        createdAt: Date.now(),
      });
      await ctx.db.insert("performers", {
        ownerId: "p_suspended",
        stageName: "Suspended Act",
        genres: ["Folk"],
        bio: "Suspended",
        cityId,
        createdAt: Date.now(),
      });
      return { cityId };
    });

    const results = await t.query(api.performers.searchPerformers, { cityId });
    expect(results).toHaveLength(1);
    expect(results[0].stageName).toBe("Active Act");
  });
});
