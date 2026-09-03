import CafeRegistrationDraft, {
  ICafeRegistrationDraft,
} from "../../models/cafe-registration-draft";
import { findCafeByUserId } from "../cafes/cafe.repository";
import { BadRequestError } from "../../utils/errors/app.error";

type DraftStepKey = "step1" | "step2" | "step3" | "step4" | "step5";

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
  if (existingCafe && existingCafe.status !== "rejected") {
    throw new BadRequestError("Cafe already registered for this user");
  }

  const stepKey = `step${step}` as DraftStepKey;
  const existingDraft = await CafeRegistrationDraft.findOne({ userId });
  const previousStep = (existingDraft?.[stepKey] ?? {}) as Record<
    string,
    unknown
  >;

  const mergedStep = { ...previousStep, ...data };

  const draft = await CafeRegistrationDraft.findOneAndUpdate(
    { userId },
    {
      $set: {
        [stepKey]: mergedStep,
        currentStep: Math.max(step, existingDraft?.currentStep ?? 1),
      },
    },
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
      searchLocation: step2.searchLocation,
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

    cafeImage: step4.ownerPhoto ?? "",
    menuImage: "",
    gallery: step4.layoutPhotos ?? [],
    layoutPhotos: step4.layoutPhotos ?? [],
    interiorPhotos: [],
    exteriorPhotos: [],

    documents: {
      aadharNumber: "",
      aadharPhoto: "",
      panNumber: "",
      panPhoto: "",
      fssaiNumber: "",
      fssaiCertificate: step5.shopEstablishmentCertificate ?? "",
    },

    bankDetails: {
      accountHolderName: step3.accountHolderName,
      accountNumber: step3.accountNumber,
      bankName: step3.bankName ?? "",
      ifscCode: step3.ifscCode,
      upiId: "",
      gstId: step3.gstId ?? "",
      bankPassbookPhoto: step5.bankPassbookPhoto ?? "",
    },

    socialMedia: { instagram: "", facebook: "", website: "" },
    registrationFeedback: "",
  };
};
