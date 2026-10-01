import { afterEach, describe, expect, it, vi } from "vitest";
import Cafe from "../src/models/cafe";
import { findApprovedCafes, findPublicCafeById } from "../src/modules/cafes/cafe.repository";
import { swaggerSpec } from "../src/config/swagger.config";

const safeFields = [
  "cafeName", "ownerName", "description", "address", "location", "cafeImage",
  "menuImage", "gallery", "layoutPhotos", "interiorPhotos", "exteriorPhotos",
  "socialMedia", "isOpen", "isVisible", "isFeatured", "supportsDelivery",
  "status", "rating", "createdAt", "updatedAt",
];
const forbiddenFields = [
  "userId", "bankDetails", "documents", "registrationFeedback", "adminNote",
  "approvedBy", "approvedAt", "rejectedAt",
];

const queryMock = () => ({
  select: vi.fn().mockReturnThis(),
  sort: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  lean: vi.fn().mockResolvedValue([]),
});

describe("public Cafe repository projections", () => {
  afterEach(() => vi.restoreAllMocks());

  it("selects only discovery-safe fields for GET /cafes", async () => {
    const query = queryMock();
    vi.spyOn(Cafe, "find").mockReturnValue(query as never);
    vi.spyOn(Cafe, "countDocuments").mockResolvedValue(0 as never);

    await findApprovedCafes();
    const projection = query.select.mock.calls[0][0] as string;
    for (const field of safeFields) expect(projection).toContain(field);
    for (const field of forbiddenFields) expect(projection).not.toContain(field);
  });

  it("selects only discovery-safe fields for GET /cafes/:id", async () => {
    const query = queryMock();
    vi.spyOn(Cafe, "findById").mockReturnValue(query as never);

    await findPublicCafeById("cafe-1");
    const projection = query.select.mock.calls[0][0] as string;
    for (const field of safeFields) expect(projection).toContain(field);
    for (const field of forbiddenFields) expect(projection).not.toContain(field);
  });

  it("documents canonical multipart fields without exposing system request fields", () => {
    const operation = swaggerSpec.paths["/cafes/register"].post;
    const requestSchema = operation.requestBody.content["multipart/form-data"].schema;
    const properties = requestSchema.properties;
    for (const field of [
      "cafeImage", "menuImage", "gallery", "layoutPhotos", "interiorPhotos",
      "exteriorPhotos", "aadharPhoto", "panPhoto", "fssaiCertificate",
      "bankPassbookPhoto", "confirmAccountNumber", "supportsDelivery",
    ]) expect(properties[field]).toBeDefined();
    for (const field of ["userId", "status", "isBlocked", "adminNote", "rating", "stats"])
      expect(properties[field]).toBeUndefined();
    for (const status of ["201", "400", "401", "403", "409", "422", "500"])
      expect(operation.responses[status]).toBeDefined();
  });
});
