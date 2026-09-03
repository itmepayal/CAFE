import {
  findDraftByUserId,
  upsertDraftStep,
  deleteDraftByUserId,
  buildRegistrationPayloadFromDraft,
} from "./cafe-draft.repository";
import { registerCafeService } from "./cafe.service";
import { BadRequestError, NotFoundError } from "../../utils/errors/app.error";
import { logger } from "../../config/logger.config";
import { collectFigmaRegistrationMediaErrors } from "./cafe.validation";

const emptyDraft = () => ({
  currentStep: 1,
  step1: {},
  step2: {},
  step3: {},
  step4: {},
  step5: {},
});

export const getRegistrationDraftService = async (userId: string) => {
  const draft = await findDraftByUserId(userId);
  return draft ?? emptyDraft();
};

export const saveRegistrationDraftStepService = async (
  userId: string,
  step: number,
  data: Record<string, unknown>,
) => {
  logger.info("Saving cafe registration draft step", { userId, step });
  return upsertDraftStep(userId, step, data);
};

const validateDraftCompleteness = (
  draft: NonNullable<Awaited<ReturnType<typeof findDraftByUserId>>>,
) => {
  const errors: string[] = [];

  if (!draft.step1.cafeName || !draft.step1.ownerName || !draft.step1.mobile) {
    errors.push("Step 1 (Cafe Details) is incomplete");
  }

  if (!draft.step2.city) {
    errors.push("Step 2 (Location) is incomplete — city is required");
  }

  if (
    !draft.step3.accountHolderName ||
    !draft.step3.accountNumber ||
    !draft.step3.ifscCode
  ) {
    errors.push("Step 3 (Financials) is incomplete");
  }

  errors.push(
    ...collectFigmaRegistrationMediaErrors({
      ownerPhoto: draft.step4.ownerPhoto,
      layoutPhotos: draft.step4.layoutPhotos,
      shopEstablishmentCertificate: draft.step5.shopEstablishmentCertificate,
      bankPassbookPhoto: draft.step5.bankPassbookPhoto,
    }),
  );

  if (errors.length > 0) {
    throw new BadRequestError(errors.join(". "));
  }
};

export const submitRegistrationDraftService = async (userId: string) => {
  const draft = await findDraftByUserId(userId);

  if (!draft) {
    throw new NotFoundError(
      "No registration draft found. Please complete all steps.",
    );
  }

  validateDraftCompleteness(draft);

  const payload = buildRegistrationPayloadFromDraft(draft);
  const cafe = await registerCafeService(userId, payload);
  await deleteDraftByUserId(userId);

  return cafe;
};

export const clearRegistrationDraftService = async (userId: string) => {
  await deleteDraftByUserId(userId);
};
