"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const DAYS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

type PatternEntry = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  enabled: boolean;
};

export function WeeklyScheduleEditor({
  performerId,
}: {
  performerId: Id<"performers">;
}) {
  const { user } = useUser();
  const availability = useQuery(api.availability.getAvailabilityForPerformer, {
    performerId,
  });
  const setPatterns = useMutation(api.availability.setRecurringPatterns);
  const addOverride = useMutation(api.availability.addOverride);
  const removeOverride = useMutation(api.availability.removeOverride);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [blockDate, setBlockDate] = useState("");
  const [schedule, setSchedule] = useState<PatternEntry[]>(() =>
    DAYS.map((d) => ({
      dayOfWeek: d.value,
      startTime: "20:00",
      endTime: "00:00",
      enabled: false,
    })),
  );
  const [initialized, setInitialized] = useState(false);

  // Sync patterns from server once loaded
  if (availability && !initialized) {
    const patternMap = new Map<
      number,
      { startTime: string; endTime: string }
    >();
    for (const p of availability.patterns) {
      patternMap.set(p.dayOfWeek, {
        startTime: p.startTime,
        endTime: p.endTime,
      });
    }
    setSchedule(
      DAYS.map((d) => {
        const existing = patternMap.get(d.value);
        return {
          dayOfWeek: d.value,
          startTime: existing?.startTime ?? "20:00",
          endTime: existing?.endTime ?? "00:00",
          enabled: !!existing,
        };
      }),
    );
    setInitialized(true);
  }

  if (!availability || !user) {
    return <p className="text-sm text-zinc-500">Loading availability...</p>;
  }

  function toggleDay(dayOfWeek: number) {
    setSchedule((prev) =>
      prev.map((s) =>
        s.dayOfWeek === dayOfWeek ? { ...s, enabled: !s.enabled } : s,
      ),
    );
  }

  function updateTime(
    dayOfWeek: number,
    field: "startTime" | "endTime",
    value: string,
  ) {
    setSchedule((prev) =>
      prev.map((s) =>
        s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s,
      ),
    );
  }

  async function handleSavePatterns() {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    const activePatterns = schedule
      .filter((s) => s.enabled)
      .map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      }));

    await setPatterns({
      performerClerkId: user.id,
      patterns: activePatterns,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleAddBlock() {
    if (!user || !blockDate) return;
    await addOverride({
      performerClerkId: user.id,
      date: blockDate,
      type: "block",
    });
    setBlockDate("");
  }

  async function handleRemoveOverride(overrideId: Id<"availabilityOverrides">) {
    if (!user) return;
    await removeOverride({ performerClerkId: user.id, overrideId });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Weekly Schedule
        </h3>
        <div className="flex flex-col gap-2">
          {DAYS.map((day) => {
            const entry = schedule.find((s) => s.dayOfWeek === day.value)!;
            return (
              <div key={day.value} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`w-12 rounded-lg py-2 text-center text-xs font-medium transition-colors ${
                    entry.enabled
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "border border-zinc-300 text-zinc-500 dark:border-zinc-700"
                  }`}
                >
                  {day.label}
                </button>
                {entry.enabled && (
                  <>
                    <input
                      type="time"
                      value={entry.startTime}
                      onChange={(e) =>
                        updateTime(day.value, "startTime", e.target.value)
                      }
                      className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                    />
                    <span className="text-xs text-zinc-500">to</span>
                    <input
                      type="time"
                      value={entry.endTime}
                      onChange={(e) =>
                        updateTime(day.value, "endTime", e.target.value)
                      }
                      className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSavePatterns}
            disabled={saving}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
          >
            {saving ? "Saving..." : "Save Schedule"}
          </button>
          {saved && (
            <span className="text-sm text-green-600 dark:text-green-400">
              Saved!
            </span>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Date Overrides
        </h3>
        <div className="mb-3 flex items-center gap-2">
          <input
            type="date"
            value={blockDate}
            onChange={(e) => setBlockDate(e.target.value)}
            className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <button
            type="button"
            onClick={handleAddBlock}
            disabled={!blockDate}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Block Date
          </button>
        </div>
        {availability.overrides.length > 0 ? (
          <div className="flex flex-col gap-1">
            {availability.overrides.map((o) => (
              <div
                key={o._id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
              >
                <span className="text-sm text-zinc-900 dark:text-zinc-50">
                  {o.date}{" "}
                  <span
                    className={`text-xs ${o.type === "block" ? "text-red-500" : "text-green-500"}`}
                  >
                    ({o.type})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveOverride(o._id)}
                  className="text-xs text-zinc-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No date overrides set.</p>
        )}
      </div>
    </div>
  );
}
