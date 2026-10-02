import { describe, expect, it } from "vitest";
import User from "../src/models/user";

describe("deleted OAuth identity persistence schema", () => {
  it("keeps a deletion marker while retaining provider identity fields", () => {
    expect(User.schema.path("deletedAt")).toBeDefined();
    expect(User.schema.path("deletedAt").options.default).toBeNull();
    expect(User.schema.path("provider")).toBeDefined();
    expect(User.schema.path("providerId")).toBeDefined();
    expect(
      User.schema.indexes().some(
        ([keys, options]) =>
          keys.provider === 1 &&
          keys.providerId === 1 &&
          Object.keys(keys).length === 2 &&
          options.unique === true,
      ),
    ).toBe(true);
  });
});
