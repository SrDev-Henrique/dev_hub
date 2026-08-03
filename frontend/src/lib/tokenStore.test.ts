import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  notifyUnauthorized,
  setAccessToken,
  setOnUnauthorized,
  setTokens,
} from "@/lib/tokenStore";

describe("tokenStore", () => {
  beforeEach(() => {
    localStorage.clear();
    clearTokens();
  });

  it("starts with no tokens", () => {
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it("persists tokens to localStorage on setTokens", () => {
    setTokens("access-123", "refresh-456");

    expect(getAccessToken()).toBe("access-123");
    expect(getRefreshToken()).toBe("refresh-456");
    expect(localStorage.getItem("access_token")).toBe("access-123");
    expect(localStorage.getItem("refresh_token")).toBe("refresh-456");
  });

  it("updates only the access token via setAccessToken", () => {
    setTokens("access-1", "refresh-1");
    setAccessToken("access-2");

    expect(getAccessToken()).toBe("access-2");
    expect(getRefreshToken()).toBe("refresh-1");
  });

  it("removes both tokens from memory and localStorage on clearTokens", () => {
    setTokens("access-1", "refresh-1");
    clearTokens();

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("refresh_token")).toBeNull();
  });

  it("invokes the registered onUnauthorized callback", () => {
    const callback = vi.fn();
    setOnUnauthorized(callback);

    notifyUnauthorized();

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
