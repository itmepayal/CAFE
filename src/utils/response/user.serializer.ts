export const serializePublicUser = (user: any) => {
  if (!user) return null;
  return {
    id: user._id || user.id,
    name: user.name,
    email: user.email,
    profileImage: user.profileImage,
    phone: user.phone,
    provider: user.provider,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isBlocked: user.isBlocked,
    isActive: user.isActive,
    ownedCafe: user.ownedCafe,
    favoriteCafes: user.favoriteCafes,
    university: user.university,
    hostel: user.hostel,
    lastLoginAt: user.lastLoginAt,
    loginCount: user.loginCount,
    isCafeOwner: user.isCafeOwner,
  };
};

export const serializeCurrentUser = (user: any) => {
  if (!user) return null;
  return {
    id: user._id?.toString?.() ?? user.id,
    name: user.name,
    email: user.email,
    profileImage: user.profileImage,
    phone: user.phone,
    role: user.role,
    provider: user.provider,
    isEmailVerified: user.isEmailVerified,
    university: user.university,
    hostel: user.hostel,
    isCafeOwner: user.isCafeOwner,
  };
};
