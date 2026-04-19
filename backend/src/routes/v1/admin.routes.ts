import { Router } from "express";
import { z } from "zod";
import { BookingStatus, KycStatus, UserRole, VehicleStatus } from "../../domain/enums";
import { countOffers } from "../../firestore/offers";
import { countTripPosts } from "../../firestore/tripPosts";
import { countBookings, listBookingsAdmin, updateBookingStatus } from "../../firestore/bookings";
import {
  countPendingKyc,
  countUsers,
  getProviderProfile,
  getUserById,
  listUsers,
  updateProviderKyc,
  updateUserRoleName,
} from "../../firestore/users";
import {
  countVehicles,
  countVehiclesByStatus,
  getVehicleById,
  listVehiclesByStatus,
  updateVehicleStatus,
} from "../../firestore/vehicles";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { HttpError } from "../../utils/httpError";
import { moneyToString } from "../../utils/money";
import { serializeVehicle } from "../../utils/serializeVehicle";

export const adminRouter = Router();

const userRoleZ = z.enum([UserRole.TRAVELER, UserRole.PROVIDER, UserRole.ADMIN]);
const vehicleStatusZ = z.enum([
  VehicleStatus.DRAFT,
  VehicleStatus.PENDING_APPROVAL,
  VehicleStatus.ACTIVE,
  VehicleStatus.INACTIVE,
]);
const bookingStatusZ = z.enum([
  BookingStatus.PENDING,
  BookingStatus.CONTACTED,
  BookingStatus.BOOKED,
  BookingStatus.CONFIRMED,
  BookingStatus.ONGOING,
  BookingStatus.COMPLETED,
  BookingStatus.CANCELLED,
]);
const kycStatusZ = z.enum([KycStatus.PENDING, KycStatus.APPROVED, KycStatus.REJECTED]);

adminRouter.use(requireAuth(UserRole.ADMIN));

adminRouter.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const [users, vehicles, bookings, tripPosts, offers, pendingVehicles, pendingKyc] = await Promise.all([
      countUsers(),
      countVehicles(),
      countBookings(),
      countTripPosts(),
      countOffers(),
      countVehiclesByStatus(VehicleStatus.PENDING_APPROVAL),
      countPendingKyc(),
    ]);

    res.json({
      users,
      vehicles,
      bookings,
      tripPosts,
      offers,
      pendingVehicleApprovals: pendingVehicles,
      pendingKycProfiles: pendingKyc,
    });
  }),
);

adminRouter.get(
  "/users",
  asyncHandler(async (req, res) => {
    const query = z.object({ take: z.coerce.number().int().min(1).max(200).optional() }).parse(req.query);
    const users = await listUsers(query.take ?? 80);
    res.json({
      items: users.map((u) => ({
        id: u.id,
        email: u.email,
        phone: u.phone,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt,
      })),
    });
  }),
);

const patchUserSchema = z.object({
  role: userRoleZ.optional(),
  name: z.string().min(1).max(120).optional(),
});

adminRouter.patch(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    const body = patchUserSchema.parse(req.body);

    const user = await updateUserRoleName(params.id, {
      ...(body.role ? { role: body.role } : {}),
      ...(body.name ? { name: body.name } : {}),
    });

    res.json({ id: user.id, email: user.email, phone: user.phone, name: user.name, role: user.role });
  }),
);

adminRouter.get(
  "/vehicles/pending",
  asyncHandler(async (_req, res) => {
    const itemsRaw = await listVehiclesByStatus(VehicleStatus.PENDING_APPROVAL);
    const items = await Promise.all(
      itemsRaw.map(async (v) => {
        const provider = await getUserById(v.providerId);
        return {
          ...serializeVehicle(v),
          provider: provider
            ? { id: provider.id, name: provider.name, email: provider.email, phone: provider.phone }
            : { id: v.providerId, name: "", email: null, phone: null },
        };
      }),
    );
    res.json({ items });
  }),
);

const patchVehicleSchema = z.object({
  status: vehicleStatusZ,
});

adminRouter.patch(
  "/vehicles/:id",
  asyncHandler(async (req, res) => {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    const body = patchVehicleSchema.parse(req.body);

    const vehicle = await updateVehicleStatus(params.id, body.status);

    res.json({ id: vehicle.id, status: vehicle.status, brand: vehicle.brand, model: vehicle.model });
  }),
);

adminRouter.get(
  "/bookings",
  asyncHandler(async (req, res) => {
    const query = z.object({ take: z.coerce.number().int().min(1).max(200).optional() }).parse(req.query);
    const rows = await listBookingsAdmin(query.take ?? 80);
    const items = await Promise.all(
      rows.map(async (b) => {
        const [traveler, provider, vehicle] = await Promise.all([
          getUserById(b.travelerId),
          getUserById(b.providerId),
          getVehicleById(b.vehicleId),
        ]);
        return {
          ...b,
          traveler: traveler ? { id: traveler.id, name: traveler.name } : { id: b.travelerId, name: "" },
          provider: provider ? { id: provider.id, name: provider.name } : { id: b.providerId, name: "" },
          vehicle: vehicle
            ? { id: vehicle.id, brand: vehicle.brand, model: vehicle.model, type: vehicle.type }
            : { id: b.vehicleId, brand: "", model: "", type: "CAR" },
        };
      }),
    );
    res.json({ items });
  }),
);

const patchBookingSchema = z.object({
  status: bookingStatusZ,
});

adminRouter.patch(
  "/bookings/:id",
  asyncHandler(async (req, res) => {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    const body = patchBookingSchema.parse(req.body);

    const booking = await updateBookingStatus(params.id, body.status);

    res.json({ id: booking.id, status: booking.status, totalPrice: moneyToString(booking.totalPrice) });
  }),
);

adminRouter.patch(
  "/providers/:userId/kyc",
  asyncHandler(async (req, res) => {
    const params = z.object({ userId: z.string().min(1) }).parse(req.params);
    const body = z.object({ kycStatus: kycStatusZ }).parse(req.body);

    const profile = await getProviderProfile(params.userId);
    if (!profile) {
      throw new HttpError(404, "Provider profile not found");
    }

    try {
      await updateProviderKyc(params.userId, body.kycStatus);
    } catch (e) {
      if (e instanceof Error && e.message === "NOT_FOUND") {
        throw new HttpError(404, "Provider profile not found");
      }
      throw e;
    }

    res.json({ userId: params.userId, kycStatus: body.kycStatus });
  }),
);
