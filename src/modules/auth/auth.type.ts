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
  profileImage?: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface AdminLoginPayload {
  provider: "google" | "apple";
  token?: string;
  identityToken?: string;
}
