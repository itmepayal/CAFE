import { describe, expect, it } from "vitest";
import User from "../src/models/user";

describe("first-admin database claim", () => {
  it("defines a unique sparse index for the singleton bootstrap key", () => {
    const bootstrapIndex = User.schema.indexes().find(([keys]) => "bootstrapKey" in keys);
    expect(bootstrapIndex?.[0]).toEqual({ bootstrapKey: 1 });
    expect(bootstrapIndex?.[1]).toMatchObject({ unique: true, sparse: true });
  });
});
