import { SignOutButton } from "@clerk/nextjs";

export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-zinc-950">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Account Suspended
        </h1>
        <p className="mt-3 text-zinc-500 dark:text-zinc-400">
          Your account has been suspended by an administrator. If you believe
          this is an error, please contact support.
        </p>
        <div className="mt-6">
          <SignOutButton>
            <button
              type="button"
              className="rounded-full border border-zinc-300 px-6 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
            >
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
