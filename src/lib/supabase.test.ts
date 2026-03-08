import { describe, expect, it } from "vitest";

import { getErrorMessage, isSupabaseSetupError } from "@/lib/supabase";

describe("supabase helpers", () => {
  it("recognizes missing table errors as setup issues", () => {
    expect(
      isSupabaseSetupError(
        new Error("Could not find the table 'public.stores' in the schema cache"),
      ),
    ).toBe(true);
  });

  it("recognizes missing relationship errors as setup issues", () => {
    expect(
      isSupabaseSetupError(
        new Error(
          "Could not find a relationship between 'stores' and 'store_images' in the schema cache",
        ),
      ),
    ).toBe(true);
  });

  it("recognizes missing bucket errors as setup issues", () => {
    expect(isSupabaseSetupError(new Error("Bucket not found"))).toBe(true);
  });

  it("recognizes network bootstrap errors as setup issues", () => {
    expect(isSupabaseSetupError(new TypeError("fetch failed"))).toBe(true);
  });

  it("does not swallow unrelated runtime errors", () => {
    expect(
      isSupabaseSetupError(new Error("TypeError: Cannot read properties of undefined")),
    ).toBe(false);
  });

  it("normalizes unknown error values", () => {
    expect(getErrorMessage("plain string")).toBe("plain string");
    expect(getErrorMessage({})).toBe("알 수 없는 오류");
  });
});
