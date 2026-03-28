"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function CitySelector() {
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestName, setRequestName] = useState("");
  const [requestState, setRequestState] = useState("");
  const [requestCountry] = useState("US");
  const [requestStatus, setRequestStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [requestError, setRequestError] = useState("");

  const cities = useQuery(api.cities.getActiveCities);
  const setCity = useMutation(api.users.setCity);
  const requestCity = useMutation(api.cityRequests.requestCity);
  const { user } = useUser();
  const router = useRouter();

  const filteredCities = cities?.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.stateOrRegion.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleContinue() {
    if (!selectedCityId || !user) return;
    setLoading(true);
    try {
      await setCity({
        clerkId: user.id,
        cityId: selectedCityId as Id<"cities">,
      });
      router.push("/dashboard");
    } catch {
      setLoading(false);
    }
  }

  async function handleRequestCity() {
    if (!requestName.trim() || !requestState.trim() || !user) return;
    setRequestStatus("submitting");
    setRequestError("");
    try {
      await requestCity({
        clerkId: user.id,
        name: requestName.trim(),
        stateOrRegion: requestState.trim(),
        country: requestCountry,
      });
      setRequestStatus("success");
      setRequestName("");
      setRequestState("");
    } catch (err) {
      setRequestStatus("error");
      setRequestError(
        err instanceof Error ? err.message : "Failed to submit request",
      );
    }
  }

  if (!cities) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Loading cities...
      </p>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <input
        type="text"
        placeholder="Search cities..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-zinc-400"
      />

      <div className="flex w-full flex-col gap-2">
        {filteredCities?.map((city) => (
          <button
            key={city._id}
            type="button"
            onClick={() => setSelectedCityId(city._id)}
            className={`flex items-center justify-between rounded-lg border-2 px-4 py-3 text-left transition-all ${
              selectedCityId === city._id
                ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800"
                : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500"
            }`}
          >
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {city.name}
            </span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {city.stateOrRegion}, {city.country}
            </span>
          </button>
        ))}

        {filteredCities?.length === 0 && (
          <p className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No cities match your search.
          </p>
        )}
      </div>

      {/* Request a new city */}
      {!showRequestForm && requestStatus !== "success" && (
        <button
          type="button"
          onClick={() => setShowRequestForm(true)}
          className="text-sm text-zinc-500 dark:text-zinc-400"
        >
          Don&apos;t see your city?{" "}
          <span className="font-medium text-zinc-900 underline dark:text-zinc-50">
            Request a new city
          </span>
        </button>
      )}

      {showRequestForm && requestStatus !== "success" && (
        <div className="w-full rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Request a new city
          </h3>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="City name (e.g., Memphis)"
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
            <input
              type="text"
              placeholder="State/Region (e.g., TN)"
              value={requestState}
              onChange={(e) => setRequestState(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
            {requestStatus === "error" && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {requestError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRequestCity}
                disabled={
                  !requestName.trim() ||
                  !requestState.trim() ||
                  requestStatus === "submitting"
                }
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
              >
                {requestStatus === "submitting" ? "Submitting..." : "Submit"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRequestForm(false);
                  setRequestError("");
                  setRequestStatus("idle");
                }}
                className="rounded-lg px-4 py-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {requestStatus === "success" && (
        <div className="w-full rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
          <p className="text-sm text-green-700 dark:text-green-300">
            Request submitted! We&apos;ll review it shortly.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={handleContinue}
        disabled={!selectedCityId || loading}
        className="flex h-12 items-center justify-center rounded-full bg-zinc-900 px-10 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {loading ? "Setting up..." : "Continue"}
      </button>
    </div>
  );
}
