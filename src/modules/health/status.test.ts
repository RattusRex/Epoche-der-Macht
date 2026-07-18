import { describe, expect, it } from "vitest";
import { getLiveness } from "./status";

describe("getLiveness", () => {
  it("returns the stable web service contract", () => {
    expect(getLiveness()).toEqual({ status: "ok", service: "epoha-web" });
  });
});
