import { OAuth2Client } from "google-auth-library";
import { serverConfig } from "../config";

const client = new OAuth2Client(serverConfig.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (idToken: string) => {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: serverConfig.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new Error("Invalid Google token");
  }

  return {
    providerId: payload.sub,
    email: payload.email,
    name: payload.name,
    profileImage: payload.picture,
    emailVerified: payload.email_verified,
  };
};
