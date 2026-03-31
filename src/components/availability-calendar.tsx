"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function AvailabilityCalendar({
  performerId,
  onDateSelect,
}: {
  performerId: Id<"performers">;
  onDateSelect?: (date: string) => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const calendar = useQuery(api.availability.getComputedAvailability, {
    performerId,
    startDate: today,
    days: 30,
  });

  if (!calendar) {
    return <p className="text-sm text-zinc-500">Loading calendar...</p>;
  }

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
  const firstDayOfWeek = new Date(today + "T00:00:00").getDay();

  return (
    <div className="w-full">
      <div className="mb-2 grid grid-cols-7 gap-1">
        {dayLabels.map((label, i) => (
          <div
            key={i}
            className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {/* Spacers for alignment */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`spacer-${i}`} />
        ))}
        {calendar.map((day) => {
          const dayNum = parseInt(day.date.split("-")[2], 10);
          const isAvailable = day.status === "available";
          const isBlocked = day.status === "blocked";

          return (
            <button
              key={day.date}
              type="button"
              disabled={!isAvailable || !onDateSelect}
              onClick={() => isAvailable && onDateSelect?.(day.date)}
              className={`flex h-9 w-full items-center justify-center rounded text-xs font-medium transition-colors ${
                isAvailable
                  ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
                  : isBlocked
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
              } ${isAvailable && onDateSelect ? "cursor-pointer" : "cursor-default"}`}
              title={`${day.date}: ${day.status}${day.startTime ? ` (${day.startTime}-${day.endTime})` : ""}`}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-green-100 dark:bg-green-900" />{" "}
          Available
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-red-100 dark:bg-red-900" />{" "}
          Blocked
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-zinc-100 dark:bg-zinc-800" />{" "}
          Unavailable
        </span>
      </div>
    </div>
  );
}
