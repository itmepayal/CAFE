import {
  findDraftByUserId,
  upsertDraftStep,
  deleteDraftByUserId,
  buildRegistrationPayloadFromDraft,
} from "./cafe-draft.repository";
import { registerCafeService } from "./cafe.service";
import { BadRequestError, NotFoundError } from "../../utils/errors/app.error";
import { logger } from "../../config/logger.config";

export const getRegistrationDraftService = async (userId: string) => {
  const draft = await findDraftByUserId(userId);

  if (!draft) {
    return {
      currentStep: 1,
      step1: {},
      step2: {},
      step3: {},
      step4: {},
      step5: {},
    };
  }

  return draft;
};

export const saveRegistrationDraftStepService = async (
  userId: string,
  step: number,
  data: Record<string, unknown>,
) => {
  logger.info("Saving cafe registration draft step", { userId, step });

  const draft = await upsertDraftStep(userId, step, data);

  return draft;
};

export const submitRegistrationDraftService = async (userId: string) => {
  const draft = await findDraftByUserId(userId);

  if (!draft) {
    throw new NotFoundError("No registration draft found. Please complete all steps.");
  }

  const payload = buildRegistrationPayloadFromDraft(draft);

  const requiredFields = [
    payload.cafeName,
    payload.ownerName,
    payload.mobile,
    payload.documents.aadharNumber,
    payload.documents.panNumber,
    payload.documents.fssaiNumber,
    payload.bankDetails.accountHolderName,
    payload.bankDetails.accountNumber,
    payload.bankDetails.bankName,
    payload.bankDetails.ifscCode,
    payload.bankDetails.upiId,
  ];

  if (requiredFields.some((field) => !field)) {
    throw new BadRequestError(
      "Registration draft is incomplete. Please complete all 5 steps before submitting.",
    );
  }

  const cafe = await registerCafeService(userId, payload);
  await deleteDraftByUserId(userId);

  return cafe;
};

export const clearRegistrationDraftService = async (userId: string) => {
  await deleteDraftByUserId(userId);
};
