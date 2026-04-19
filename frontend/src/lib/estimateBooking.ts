import type { BookingType } from "./bookingTypes";

/** Mirrors backend `estimateBookingTotal` for UI preview only. */
export function estimateBookingTotalPreview(params: {
  bookingType: BookingType;
  startAt: Date;
  endAt: Date;
  pricePerDay: number;
  minimumCharge: number;
}): number | null {
  const ms = params.endAt.getTime() - params.startAt.getTime();
  if (ms <= 0) {
    return null;
  }
  const hours = ms / (1000 * 60 * 60);
  const days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  const perDay = params.pricePerDay;
  const minimum = params.minimumCharge;
  let raw = 0;
  if (params.bookingType === "HOURLY") {
    raw = (perDay / 24) * hours;
  } else {
    raw = perDay * days;
  }
  return Math.max(minimum, Math.round(raw * 100) / 100);
}

export function parseMoneyInput(s: string | null | undefined): number {
  if (!s) {
    return 0;
  }
  const n = Number(String(s).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
