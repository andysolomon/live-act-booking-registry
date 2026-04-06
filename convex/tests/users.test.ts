import { describe, expect, test } from "vitest";
import { createTest } from "./setup";
import { api } from "../_generated/api";

describe("users mutations", () => {
  test("createUser inserts a new user", async () => {
    const t = createTest();
    const userId = await t.mutation(api.users.createUser, {
      clerkId: "user_test_1",
    });
    expect(userId).toBeDefined();

    const user = await t.query(api.users.getUserByClerkId, {
      clerkId: "user_test_1",
    });
    expect(user).not.toBeNull();
    expect(user?.clerkId).toBe("user_test_1");
  });

  test("createUser is idempotent", async () => {
    const t = createTest();
    const id1 = await t.mutation(api.users.createUser, {
      clerkId: "user_test_2",
    });
    const id2 = await t.mutation(api.users.createUser, {
      clerkId: "user_test_2",
    });
    expect(id1).toBe(id2);
  });

  test("setRole sets the user's role", async () => {
    const t = createTest();
    await t.mutation(api.users.createUser, { clerkId: "user_test_3" });
    await t.mutation(api.users.setRole, {
      clerkId: "user_test_3",
      role: "performer",
    });

    const user = await t.query(api.users.getUserByClerkId, {
      clerkId: "user_test_3",
    });
    expect(user?.role).toBe("performer");
  });

  test("setRole rejects changing an existing role", async () => {
    const t = createTest();
    await t.mutation(api.users.createUser, { clerkId: "user_test_4" });
    await t.mutation(api.users.setRole, {
      clerkId: "user_test_4",
      role: "performer",
    });
    await expect(
      t.mutation(api.users.setRole, {
        clerkId: "user_test_4",
        role: "venue_owner",
      }),
    ).rejects.toThrow();
  });
});
