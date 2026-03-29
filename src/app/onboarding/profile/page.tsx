import { currentUser } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { VenueProfileForm } from "@/components/venue-profile-form";
import { PerformerProfileForm } from "@/components/performer-profile-form";
import { PlannerProfileForm } from "@/components/planner-profile-form";

export default async function ProfileOnboardingPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const convexUser = await fetchQuery(api.users.getUserByClerkId, {
    clerkId: clerkUser.id,
  });

  if (!convexUser?.role) redirect("/onboarding/role-selection");
  if (!convexUser.cityId) redirect("/onboarding/city");

  const city = await fetchQuery(api.cities.getCityById, {
    cityId: convexUser.cityId,
  });

  if (!city) redirect("/onboarding/city");

  const titles: Record<string, string> = {
    venue_owner: "Set up your venue",
    performer: "Create your performer profile",
    planner: "Set up your planner profile",
  };

  const descriptions: Record<string, string> = {
    venue_owner: "Tell performers and planners about your venue.",
    performer:
      "Help venues discover you with your stage name, genres, and bio.",
    planner: "Let us know about the events you plan.",
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-24 dark:bg-zinc-950">
      <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {titles[convexUser.role] ?? "Complete your profile"}
        </h1>
        <p className="max-w-md text-zinc-500 dark:text-zinc-400">
          {descriptions[convexUser.role] ?? ""}
        </p>

        {convexUser.role === "venue_owner" && (
          <VenueProfileForm cityId={convexUser.cityId} cityName={city.name} />
        )}
        {convexUser.role === "performer" && (
          <PerformerProfileForm
            cityId={convexUser.cityId}
            cityName={city.name}
          />
        )}
        {convexUser.role === "planner" && (
          <PlannerProfileForm
            cityId={convexUser.cityId}
            cityName={city.name}
          />
        )}
      </div>
    </div>
  );
}
