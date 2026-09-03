export type Provider = "google" | "apple";

export type ExpectedRole = "student" | "cafe_owner" | "super_admin";

export interface ProviderProfile {
  provider: Provider;
  providerId: string;
  email: string;
  name?: string;
  profileImage?: string;
}

export interface SocialLoginPayload {
  provider: Provider;
  token?: string;
  identityToken?: string;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  university?: string;
  hostel?: string;
  profileImage?: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface AdminEmailLoginPayload {
  email: string;
  password: string;
}

export interface AdminEmailRegisterPayload {
  name: string;
  email: string;
  password: string;
  inviteToken?: string;
}

/** @deprecated Admin uses email/password — kept for cafe-owner social login */
export interface AdminLoginPayload {
  provider: "google" | "apple";
  token?: string;
  identityToken?: string;
  inviteToken?: string;
}
