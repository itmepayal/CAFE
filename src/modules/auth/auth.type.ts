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

export interface AdminRegisterPayload {
  provider: "google" | "apple";
  token?: string;
  identityToken?: string;
}
