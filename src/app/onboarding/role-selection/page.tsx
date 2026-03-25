import { RoleSelector } from "@/components/role-selector";

export default function RoleSelectionPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-24 dark:bg-zinc-950">
      <div className="flex max-w-2xl flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          How will you use the platform?
        </h1>
        <p className="max-w-md text-zinc-500 dark:text-zinc-400">
          Choose your role to get started. This determines your dashboard
          experience.
        </p>
        <RoleSelector />
      </div>
    </div>
  );
}
