import type { UserRole } from "./roles";

const ROUTE_ACCESS: Record<string, UserRole[]> = {
  "/dashboard": [
    "venue_owner",
    "performer",
    "planner",
    "admin",
    "city_manager",
  ],
  "/dashboard/venue-settings": ["venue_owner"],
  "/dashboard/availability": ["performer"],
  "/dashboard/admin": ["admin", "city_manager"],
  "/dashboard/admin/users": ["admin"],
};

export function canAccessRoute(role: UserRole, path: string): boolean {
  const allowedRoles = ROUTE_ACCESS[path];
  if (!allowedRoles) {
    return true;
  }
  return allowedRoles.includes(role);
}
