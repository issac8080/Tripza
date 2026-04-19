import type { BookingType } from "../domain/enums";
import { HttpError } from "./httpError";

export function estimateBookingTotal(params: {
  bookingType: BookingType;
  startAt: Date;
  endAt: Date;
  pricePerDay: number;
  minimumCharge: number;
}): number {
  const ms = params.endAt.getTime() - params.startAt.getTime();
  if (ms <= 0) {
    throw new HttpError(400, "endAt must be after startAt");
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
