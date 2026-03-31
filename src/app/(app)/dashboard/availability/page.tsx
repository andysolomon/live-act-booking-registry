import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { canAccessRoute } from "@/lib/route-access";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { WeeklyScheduleEditor } from "@/components/weekly-schedule-editor";
import { AvailabilityCalendar } from "@/components/availability-calendar";

export default async function AvailabilityPage() {
  const { clerkUser, convexUser } = await getAuthenticatedUser();

  if (!canAccessRoute(convexUser.role, "/dashboard/availability")) {
    redirect("/dashboard");
  }

  const performer = await fetchQuery(api.performers.getPerformerByOwner, {
    clerkId: clerkUser.id,
  });

  if (!performer) {
    redirect("/onboarding/profile");
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Availability
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Set your recurring schedule and manage date-specific overrides.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <WeeklyScheduleEditor performerId={performer._id} />
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
            30-Day Preview
          </h3>
          <AvailabilityCalendar performerId={performer._id} />
        </div>
      </div>
    </div>
  );
}
