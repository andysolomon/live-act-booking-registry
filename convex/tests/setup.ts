/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import schema from "../schema";

// Load all convex modules for the test runner
const modules = import.meta.glob("../**/*.ts");

export function createTest() {
  return convexTest(schema, modules);
}
