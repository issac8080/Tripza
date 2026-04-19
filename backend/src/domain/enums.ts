export const UserRole = {
  TRAVELER: "TRAVELER",
  PROVIDER: "PROVIDER",
  ADMIN: "ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const PreferredLanguage = { EN: "EN", ML: "ML" } as const;
export type PreferredLanguage = (typeof PreferredLanguage)[keyof typeof PreferredLanguage];

export const ProviderBusinessType = { INDIVIDUAL: "INDIVIDUAL", AGENCY: "AGENCY" } as const;
export type ProviderBusinessType = (typeof ProviderBusinessType)[keyof typeof ProviderBusinessType];

export const KycStatus = { PENDING: "PENDING", APPROVED: "APPROVED", REJECTED: "REJECTED" } as const;
export type KycStatus = (typeof KycStatus)[keyof typeof KycStatus];

export const VehicleType = {
  BIKE: "BIKE",
  CAR: "CAR",
  JEEP: "JEEP",
  TRAVELLER: "TRAVELLER",
  BUS: "BUS",
} as const;
export type VehicleType = (typeof VehicleType)[keyof typeof VehicleType];

export const VehicleStatus = {
  DRAFT: "DRAFT",
  PENDING_APPROVAL: "PENDING_APPROVAL",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;
export type VehicleStatus = (typeof VehicleStatus)[keyof typeof VehicleStatus];

export const LuxuryLevel = { BASIC: "BASIC", COMFORT: "COMFORT", PREMIUM: "PREMIUM" } as const;
export type LuxuryLevel = (typeof LuxuryLevel)[keyof typeof LuxuryLevel];

export const TripPostStatus = {
  DRAFT: "DRAFT",
  OPEN: "OPEN",
  /** Traveler marked that a provider reached out (outside app). */
  CONTACTED: "CONTACTED",
  /** Trip arranged off-app; listing can be closed. */
  BOOKED: "BOOKED",
  AWARDED: "AWARDED",
  CANCELLED: "CANCELLED",
} as const;
export type TripPostStatus = (typeof TripPostStatus)[keyof typeof TripPostStatus];

export const OfferStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  WITHDRAWN: "WITHDRAWN",
} as const;
export type OfferStatus = (typeof OfferStatus)[keyof typeof OfferStatus];

export const BookingMode = { INSTANT: "INSTANT", REQUEST: "REQUEST" } as const;
export type BookingMode = (typeof BookingMode)[keyof typeof BookingMode];

export const BookingType = { HOURLY: "HOURLY", DAILY: "DAILY", MULTI_DAY: "MULTI_DAY" } as const;
export type BookingType = (typeof BookingType)[keyof typeof BookingType];

export const BookingStatus = {
  PENDING: "PENDING",
  /** Parties spoke by phone / WhatsApp (no in-app payment). */
  CONTACTED: "CONTACTED",
  /** Agreed off-app; keeps a simple paper trail in the app. */
  BOOKED: "BOOKED",
  CONFIRMED: "CONFIRMED",
  ONGOING: "ONGOING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];
