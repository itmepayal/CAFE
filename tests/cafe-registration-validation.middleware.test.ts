import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { validateCafeRegistration } from "../src/modules/cafes/cafe-registration-validation.middleware";

let tempDir = "";
afterEach(async () => {
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
  tempDir = "";
});

describe("cafe registration validation upload cleanup", () => {
  it("removes multer temp files when schema validation rejects the request", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "cafe-registration-"));
    const uploadedPath = path.join(tempDir, "upload.tmp");
    await writeFile(uploadedPath, "temporary media");
    const req = { body: { cafeName: "invalid" }, files: { cafeImage: [{ path: uploadedPath }] } };
    const next = vi.fn();

    await validateCafeRegistration(req as never, {} as never, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    await expect(readFile(uploadedPath)).rejects.toMatchObject({ code: "ENOENT" });
  });
});
