import { beforeEach, describe, expect, it, vi } from "vitest";

const { findOneAndUpdateMock } = vi.hoisted(() => ({ findOneAndUpdateMock: vi.fn() }));

vi.mock("../src/models/user", () => ({
  default: { findOneAndUpdate: (...args: unknown[]) => findOneAndUpdateMock(...args) },
}));

import { updateProfileRepo } from "../src/modules/auth/auth.repository";

describe("profile repository atomic status guard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("atomically updates only the authenticated active, unblocked, undeleted user", async () => {
    const updated = { _id: "user-1", name: "Updated" };
    findOneAndUpdateMock.mockResolvedValueOnce(updated);

    const result = await updateProfileRepo("user-1", { name: "Updated" });

    expect(result).toBe(updated);
    expect(findOneAndUpdateMock).toHaveBeenCalledWith(
      { _id: "user-1", isActive: true, isBlocked: false, deletedAt: null },
      { $set: { name: "Updated" } },
      { new: true, runValidators: true },
    );
  });

  it("does not update a user who became deleted, blocked, or inactive", async () => {
    findOneAndUpdateMock.mockResolvedValueOnce(null);
    await expect(updateProfileRepo("user-1", { name: "Updated" }))
      .rejects.toMatchObject({ statusCode: 404 });
    expect(findOneAndUpdateMock).toHaveBeenCalledOnce();
  });
});
