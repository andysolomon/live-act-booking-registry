import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { canAccessRoute } from "@/lib/route-access";
import { AdminUserList } from "@/components/admin-user-list";

export default async function AdminUsersPage() {
  const { convexUser } = await getAuthenticatedUser();

  if (!canAccessRoute(convexUser.role, "/dashboard/admin/users")) {
    redirect("/dashboard");
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          User Management
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Assign admin and city manager roles to users.
        </p>
      </div>
      <AdminUserList />
    </div>
  );
}
