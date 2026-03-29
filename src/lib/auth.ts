import { currentUser } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { api } from "../../convex/_generated/api";
import type { UserRole } from "./roles";

export async function getAuthenticatedUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  const convexUser = await fetchQuery(api.users.getUserByClerkId, {
    clerkId: clerkUser.id,
  });

  if (!convexUser?.role) {
    redirect("/onboarding/role-selection");
  }

  if (!convexUser.cityId) {
    redirect("/onboarding/city");
  }

  // Check profile exists for non-admin roles
  const role = convexUser.role;
  if (role === "venue_owner") {
    const venue = await fetchQuery(api.venues.getVenueByOwner, {
      clerkId: clerkUser.id,
    });
    if (!venue) redirect("/onboarding/profile");
  } else if (role === "performer") {
    const performer = await fetchQuery(api.performers.getPerformerByOwner, {
      clerkId: clerkUser.id,
    });
    if (!performer) redirect("/onboarding/profile");
  } else if (role === "planner") {
    const planner = await fetchQuery(api.planners.getPlannerByOwner, {
      clerkId: clerkUser.id,
    });
    if (!planner) redirect("/onboarding/profile");
  }

  return {
    clerkUser,
    convexUser: convexUser as typeof convexUser & { role: UserRole },
  };
}
