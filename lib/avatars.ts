export const AVATARS = [
  "https://res.cloudinary.com/dztzomvin/image/upload/v1773688122/Asset_1_rzofg3.svg",
  "https://res.cloudinary.com/dztzomvin/image/upload/v1773688121/Asset_4_fekky9.svg",
  "https://res.cloudinary.com/dztzomvin/image/upload/v1773688121/Asset_3_xlkpc9.svg",
] as const;

export type AvatarPath = (typeof AVATARS)[number];
