import { describe, expect, test } from "vitest";
import { createTest } from "./setup";
import { api } from "../_generated/api";

async function seedPerformer(t: ReturnType<typeof createTest>) {
  return await t.run(async (ctx) => {
    const cityId = await ctx.db.insert("cities", {
      name: "Nashville",
      stateOrRegion: "TN",
      country: "US",
      isActive: true,
      createdAt: Date.now(),
    });
    await ctx.db.insert("users", {
      clerkId: "perf_avail_1",
      role: "performer",
      cityId,
      createdAt: Date.now(),
    });
    const performerId = await ctx.db.insert("performers", {
      ownerId: "perf_avail_1",
      stageName: "Availability Test",
      genres: ["Jazz"],
      bio: "Test",
      cityId,
      createdAt: Date.now(),
    });
    return { performerId };
  });
}

describe("availability", () => {
  test("setRecurringPatterns replaces all patterns", async () => {
    const t = createTest();
    const { performerId } = await seedPerformer(t);

    await t.mutation(api.availability.setRecurringPatterns, {
      performerClerkId: "perf_avail_1",
      patterns: [
        { dayOfWeek: 5, startTime: "20:00", endTime: "23:00" },
        { dayOfWeek: 6, startTime: "20:00", endTime: "23:00" },
      ],
    });

    const result = await t.query(api.availability.getAvailabilityForPerformer, {
      performerId,
    });
    expect(result.patterns).toHaveLength(2);
  });

  test("addOverride creates a block", async () => {
    const t = createTest();
    const { performerId } = await seedPerformer(t);

    await t.mutation(api.availability.addOverride, {
      performerClerkId: "perf_avail_1",
      date: "2026-05-20",
      type: "block",
    });

    const result = await t.query(api.availability.getAvailabilityForPerformer, {
      performerId,
    });
    expect(result.overrides).toHaveLength(1);
    expect(result.overrides[0].type).toBe("block");
  });

  test("isPerformerAvailable returns false when blocked", async () => {
    const t = createTest();
    const { performerId } = await seedPerformer(t);

    await t.mutation(api.availability.setRecurringPatterns, {
      performerClerkId: "perf_avail_1",
      patterns: [{ dayOfWeek: 5, startTime: "20:00", endTime: "23:00" }],
    });
    await t.mutation(api.availability.addOverride, {
      performerClerkId: "perf_avail_1",
      date: "2026-05-22", // Friday
      type: "block",
    });

    const result = await t.query(api.availability.isPerformerAvailable, {
      performerId,
      date: "2026-05-22",
    });
    expect(result.available).toBe(false);
  });
});
