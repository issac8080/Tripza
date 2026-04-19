import { Router } from "express";
import { z } from "zod";
import { BookingMode, BookingStatus, BookingType, UserRole, VehicleStatus } from "../../domain/enums";
import { createBooking, getBookingById, listBookingsForUser, updateBookingStatus } from "../../firestore/bookings";
import { getVehicleById } from "../../firestore/vehicles";
import { getUserById } from "../../firestore/users";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { HttpError } from "../../utils/httpError";
import { estimateBookingTotal } from "../../utils/pricing";
import { moneyToString } from "../../utils/money";

export const bookingsRouter = Router();

const bookingTypeZ = z.enum([BookingType.HOURLY, BookingType.DAILY, BookingType.MULTI_DAY]);
const bookingModeZ = z.enum([BookingMode.INSTANT, BookingMode.REQUEST]);

const createBookingSchema = z.object({
  vehicleId: z.string().min(1),
  bookingType: bookingTypeZ,
  mode: bookingModeZ.default(BookingMode.REQUEST),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  pickupNotes: z.string().max(500).optional(),
  tripPostId: z.string().optional(),
});

bookingsRouter.post(
  "/",
  requireAuth(UserRole.TRAVELER, UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    if (!req.auth) {
      throw new HttpError(401, "Unauthorized");
    }

    const body = createBookingSchema.parse(req.body);

    const vehicle = await getVehicleById(body.vehicleId);
    if (!vehicle || vehicle.status !== VehicleStatus.ACTIVE) {
      throw new HttpError(404, "Vehicle not available");
    }

    if (vehicle.providerId === req.auth.userId) {
      throw new HttpError(400, "You cannot book your own vehicle");
    }

    const totalPrice = estimateBookingTotal({
      bookingType: body.bookingType,
      startAt: body.startAt,
      endAt: body.endAt,
      pricePerDay: vehicle.pricePerDay,
      minimumCharge: vehicle.minimumCharge,
    });

    const status = body.mode === BookingMode.INSTANT ? BookingStatus.CONFIRMED : BookingStatus.PENDING;

    const booking = await createBooking({
      travelerId: req.auth.userId,
      providerId: vehicle.providerId,
      vehicleId: vehicle.id,
      tripPostId: body.tripPostId,
      mode: body.mode,
      bookingType: body.bookingType,
      status,
      startAt: body.startAt,
      endAt: body.endAt,
      pickupNotes: body.pickupNotes,
      totalPrice,
    });

    res.status(201).json({
      id: booking.id,
      status: booking.status,
      totalPrice: moneyToString(booking.totalPrice),
    });
  }),
);

bookingsRouter.get(
  "/mine",
  requireAuth(),
  asyncHandler(async (req, res) => {
    if (!req.auth) {
      throw new HttpError(401, "Unauthorized");
    }

    const bookings = await listBookingsForUser(req.auth.userId);

    const items = await Promise.all(
      bookings.map(async (b) => {
        const [vehicle, traveler, provider] = await Promise.all([
          getVehicleById(b.vehicleId),
          getUserById(b.travelerId),
          getUserById(b.providerId),
        ]);
        const contactPhone = vehicle?.contactPhone ?? provider?.phone ?? null;
        return {
          id: b.id,
          role: b.travelerId === req.auth!.userId ? "TRAVELER" : "PROVIDER",
          status: b.status,
          mode: b.mode,
          bookingType: b.bookingType,
          startAt: b.startAt,
          endAt: b.endAt,
          totalPrice: moneyToString(b.totalPrice),
          vehicle: vehicle
            ? { id: vehicle.id, brand: vehicle.brand, model: vehicle.model, type: vehicle.type }
            : { id: b.vehicleId, brand: "", model: "", type: "CAR" },
          traveler: traveler
            ? { id: traveler.id, name: traveler.name, phone: traveler.phone }
            : { id: b.travelerId, name: "", phone: null },
          provider: provider
            ? { id: provider.id, name: provider.name, phone: provider.phone }
            : { id: b.providerId, name: "", phone: null },
          contactPhone,
          createdAt: b.createdAt,
        };
      }),
    );

    res.json({ items });
  }),
);

const patchBookingStatusZ = z.enum([BookingStatus.CONTACTED, BookingStatus.BOOKED, BookingStatus.CANCELLED]);

bookingsRouter.patch(
  "/:id",
  requireAuth(),
  asyncHandler(async (req, res) => {
    if (!req.auth) {
      throw new HttpError(401, "Unauthorized");
    }
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    const body = z.object({ status: patchBookingStatusZ }).parse(req.body);

    const existing = await getBookingById(params.id);
    if (!existing) {
      throw new HttpError(404, "Booking not found");
    }
    if (existing.travelerId !== req.auth.userId && existing.providerId !== req.auth.userId) {
      throw new HttpError(403, "Forbidden");
    }

    const booking = await updateBookingStatus(params.id, body.status);
    res.json({
      id: booking.id,
      status: booking.status,
      totalPrice: moneyToString(booking.totalPrice),
      updatedAt: booking.updatedAt,
    });
  }),
);
