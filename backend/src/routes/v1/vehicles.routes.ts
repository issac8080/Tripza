import { Router } from "express";
import { z } from "zod";
import { UserRole, VehicleStatus, VehicleType } from "../../domain/enums";
import { createVehicle, getVehicleById, listActiveVehicles, listVehiclesByProvider } from "../../firestore/vehicles";
import { getUserById } from "../../firestore/users";
import { asyncHandler } from "../../middleware/asyncHandler";
import { optionalAuth, requireAuth } from "../../middleware/requireAuth";
import { HttpError } from "../../utils/httpError";
import { serializeVehicle } from "../../utils/serializeVehicle";

export const vehiclesRouter = Router();

const vehicleTypeZ = z.enum([
  VehicleType.BIKE,
  VehicleType.CAR,
  VehicleType.JEEP,
  VehicleType.TRAVELLER,
  VehicleType.BUS,
]);

vehiclesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = z
      .object({
        type: vehicleTypeZ.optional(),
        ac: z.enum(["true", "false"]).optional(),
        minSeats: z.coerce.number().int().positive().optional(),
        /** Free-text place: matches base location + service areas (e.g. Munnar, Thrissur). */
        q: z.string().max(120).optional(),
      })
      .parse(req.query);

    const vehicles = await listActiveVehicles({
      ...(query.type ? { type: query.type } : {}),
      ...(query.ac ? { ac: query.ac === "true" } : {}),
      ...(query.minSeats ? { minSeats: query.minSeats } : {}),
      ...(query.q?.trim() ? { place: query.q.trim() } : {}),
    });

    const providerIds = [...new Set(vehicles.map((v) => v.providerId))];
    const users = await Promise.all(providerIds.map((id) => getUserById(id)));
    const phoneByProvider = new Map(users.filter(Boolean).map((u) => [u!.id, u!.phone]));

    res.json({
      items: vehicles.map((v) => ({
        ...serializeVehicle(v),
        providerPhone: v.contactPhone ?? phoneByProvider.get(v.providerId) ?? null,
      })),
    });
  }),
);

vehiclesRouter.get(
  "/mine",
  requireAuth(UserRole.PROVIDER, UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    if (!req.auth) {
      throw new HttpError(401, "Unauthorized");
    }
    const vehicles = await listVehiclesByProvider(req.auth.userId);
    res.json({ items: vehicles.map(serializeVehicle) });
  }),
);

vehiclesRouter.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    const row = await getVehicleById(params.id);
    if (!row) {
      throw new HttpError(404, "Vehicle not found");
    }
    const isActive = row.status === VehicleStatus.ACTIVE;
    const isOwner = req.auth?.userId === row.providerId;
    const isAdmin = req.auth?.role === UserRole.ADMIN;
    if (!isActive && !isOwner && !isAdmin) {
      throw new HttpError(404, "Vehicle not found");
    }
    const vehicle = row;
    const provider = await getUserById(vehicle.providerId);
    const providerPhone = provider?.phone ?? null;
    const contactPhone = vehicle.contactPhone ?? providerPhone;
    res.json({
      ...serializeVehicle(vehicle),
      providerPhone,
      contactPhone,
      provider: provider
        ? { id: provider.id, name: provider.name, phone: provider.phone }
        : { id: vehicle.providerId, name: "", phone: null },
    });
  }),
);

const createVehicleSchema = z.object({
  type: vehicleTypeZ,
  brand: z.string().min(1).max(80),
  model: z.string().min(1).max(80),
  seatingCapacity: z.number().int().positive().max(60),
  fuelType: z.string().max(40).optional(),
  transmission: z.string().max(40).optional(),
  ac: z.boolean().optional(),
  musicSystem: z.boolean().optional(),
  luxuryLevel: z.enum(["BASIC", "COMFORT", "PREMIUM"]).optional(),
  driverIncluded: z.boolean().optional(),
  selfDriveAllowed: z.boolean().optional(),
  baseAddress: z.string().min(3).max(240),
  serviceAreas: z.string().max(500).optional(),
  baseLat: z.number().optional(),
  baseLng: z.number().optional(),
  pricePerKm: z.number().nonnegative().optional(),
  pricePerDay: z.number().nonnegative().optional(),
  minimumCharge: z.number().nonnegative().optional(),
  contactPhone: z.string().min(8).max(20).optional(),
  imageUrls: z.array(z.string().url()).max(12).optional(),
});

vehiclesRouter.post(
  "/",
  requireAuth(UserRole.PROVIDER, UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    if (!req.auth) {
      throw new HttpError(401, "Unauthorized");
    }

    const body = createVehicleSchema.parse(req.body);
    const me = await getUserById(req.auth.userId);
    const defaultPhone = me?.phone?.trim() || null;
    const contactPhone = body.contactPhone?.trim() || defaultPhone;

    const vehicle = await createVehicle({
      providerId: req.auth.userId,
      type: body.type,
      brand: body.brand,
      model: body.model,
      seatingCapacity: body.seatingCapacity,
      fuelType: body.fuelType,
      transmission: body.transmission,
      ac: body.ac ?? false,
      musicSystem: body.musicSystem ?? false,
      luxuryLevel: body.luxuryLevel ?? "BASIC",
      driverIncluded: body.driverIncluded ?? true,
      selfDriveAllowed: body.selfDriveAllowed ?? false,
      baseAddress: body.baseAddress,
      serviceAreas: body.serviceAreas ?? null,
      baseLat: body.baseLat,
      baseLng: body.baseLng,
      pricePerKm: body.pricePerKm ?? 0,
      pricePerDay: body.pricePerDay ?? 0,
      minimumCharge: body.minimumCharge ?? 0,
      contactPhone,
      status: req.auth.role === UserRole.ADMIN ? VehicleStatus.ACTIVE : VehicleStatus.PENDING_APPROVAL,
      imageUrls: body.imageUrls,
    });

    res.status(201).json(serializeVehicle(vehicle));
  }),
);
