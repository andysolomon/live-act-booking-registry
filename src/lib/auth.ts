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

  return {
    clerkUser,
    convexUser: convexUser as typeof convexUser & { role: UserRole },
  };
}
