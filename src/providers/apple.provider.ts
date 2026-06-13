import { serverConfig } from "../config";
import appleSigninAuth from "apple-signin-auth";

export const verifyAppleToken = async (identityToken: string) => {
  try {
    const appleData = await appleSigninAuth.verifyIdToken(identityToken, {
      audience: serverConfig.APPLE_CLIENT_ID as string,
      ignoreExpiration: false,
    });

    return {
      providerId: appleData.sub,
      email: appleData.email ?? undefined,
      emailVerified: appleData.email_verified,
      firstName: "",
      lastName: "",
      avatar: null,
    };
  } catch (error) {
    throw new Error("Invalid Apple token");
  }
};
