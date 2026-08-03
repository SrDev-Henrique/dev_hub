import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins truthy class names", () => {
    const isHidden = false;
    expect(cn("a", "b", isHidden && "c", undefined, "d")).toBe("a b d");
  });

  it("resolves conflicting Tailwind classes by keeping the last one", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("merges conditional class objects", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });
});
