"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";
import { SELECTABLE_ROLES, type SelectableRole } from "@/lib/roles";

export function RoleSelector() {
  const [selected, setSelected] = useState<SelectableRole | null>(null);
  const [loading, setLoading] = useState(false);
  const setRole = useMutation(api.users.setRole);
  const { user } = useUser();
  const router = useRouter();

  async function handleContinue() {
    if (!selected || !user) return;
    setLoading(true);
    try {
      await setRole({ clerkId: user.id, role: selected });
      router.push("/dashboard");
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {SELECTABLE_ROLES.map((role) => (
          <button
            key={role.value}
            type="button"
            onClick={() => setSelected(role.value)}
            className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all ${
              selected === role.value
                ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800"
                : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500"
            }`}
          >
            <span className="text-4xl">{role.icon}</span>
            <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {role.label}
            </span>
            <span className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {role.description}
            </span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={handleContinue}
        disabled={!selected || loading}
        className="flex h-12 items-center justify-center rounded-full bg-zinc-900 px-10 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {loading ? "Setting up..." : "Continue"}
      </button>
    </div>
  );
}
