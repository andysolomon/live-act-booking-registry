import { query } from "./_generated/server";

export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const venues = await ctx.db.query("venues").collect();
    const performers = await ctx.db.query("performers").collect();
    const planners = await ctx.db.query("planners").collect();
    const pendingRequests = await ctx.db
      .query("cityRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    return {
      totalUsers: users.length,
      totalVenues: venues.length,
      totalPerformers: performers.length,
      totalPlanners: planners.length,
      pendingCityRequests: pendingRequests.length,
      suspendedUsers: users.filter((u) => u.status === "suspended").length,
    };
  },
});
