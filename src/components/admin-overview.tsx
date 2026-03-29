"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function AdminOverview() {
  const stats = useQuery(api.admin.getAdminStats);

  if (!stats) {
    return <p className="text-sm text-zinc-500">Loading stats...</p>;
  }

  const cards = [
    { label: "Total Users", value: stats.totalUsers },
    { label: "Venues", value: stats.totalVenues },
    { label: "Performers", value: stats.totalPerformers },
    { label: "Planners", value: stats.totalPlanners },
    { label: "Pending City Requests", value: stats.pendingCityRequests },
    { label: "Suspended Users", value: stats.suspendedUsers },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {card.label}
          </p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
