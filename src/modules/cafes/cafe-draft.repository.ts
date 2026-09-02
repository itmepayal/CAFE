import CafeRegistrationDraft, {
  ICafeRegistrationDraft,
} from "../../models/cafe-registration-draft";
import { findCafeByUserId } from "../cafes/cafe.repository";
import { BadRequestError } from "../../utils/errors/app.error";

export const findDraftByUserId = async (
  userId: string,
): Promise<ICafeRegistrationDraft | null> => {
  return CafeRegistrationDraft.findOne({ userId });
};

export const upsertDraftStep = async (
  userId: string,
  step: number,
  data: Record<string, unknown>,
): Promise<ICafeRegistrationDraft> => {
  const existingCafe = await findCafeByUserId(userId);
  if (existingCafe) {
    throw new BadRequestError("Cafe already registered for this user");
  }

  const stepKey = `step${step}` as
    | "step1"
    | "step2"
    | "step3"
    | "step4"
    | "step5";
  const update: Record<string, unknown> = {
    [stepKey]: data,
    currentStep: Math.max(step, 1),
  };

  const draft = await CafeRegistrationDraft.findOneAndUpdate(
    { userId },
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  return draft!;
};

export const deleteDraftByUserId = async (userId: string): Promise<void> => {
  await CafeRegistrationDraft.deleteOne({ userId });
};

export const buildRegistrationPayloadFromDraft = (
  draft: ICafeRegistrationDraft,
) => {
  const { step1, step2, step3, step4, step5 } = draft;

  return {
    cafeName: step1.cafeName,
    ownerName: step1.ownerName,
    description: step1.description ?? "",
    mobile: step1.mobile,
    email: step1.email ?? "",

    address: {
      street: step2.street,
      area: step2.area,
      city: step2.city,
      state: step2.state,
      pincode: step2.pincode,
      landmark: step2.landmark,
    },

    location: {
      latitude: step2.latitude,
      longitude: step2.longitude,
    },

    cafeImage: step4.cafeImage ?? "",
    menuImage: step4.menuImage ?? "",
    gallery: step4.gallery ?? [],
    layoutPhotos: step4.layoutPhotos ?? [],

    documents: {
      aadharNumber: step4.aadharNumber,
      panNumber: step4.panNumber,
      fssaiNumber: step4.fssaiNumber,
      aadharPhoto: step4.aadharPhoto ?? "",
      panPhoto: step4.panPhoto ?? "",
      fssaiCertificate: step4.fssaiCertificate ?? "",
    },

    bankDetails: {
      accountHolderName: step3.accountHolderName,
      accountNumber: step3.accountNumber,
      bankName: step3.bankName,
      ifscCode: step3.ifscCode,
      upiId: step3.upiId,
      gstId: step3.gstId ?? "",
      bankPassbookPhoto: step4.bankPassbookPhoto ?? "",
    },

    socialMedia: {
      instagram: step5?.socialMedia?.instagram ?? "",
      facebook: step5?.socialMedia?.facebook ?? "",
      website: step5?.socialMedia?.website ?? "",
    },

    registrationFeedback: step5?.registrationFeedback ?? "",
  };
};
