export const pick = <T extends Record<string, any>>(
  obj: T,
  allowedFields: readonly string[],
) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => allowedFields.includes(key)),
  );
};

export const generatePickupCode = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};
