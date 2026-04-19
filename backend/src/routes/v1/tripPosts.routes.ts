import { Router } from "express";
import { z } from "zod";
import { TripPostStatus as TripPostStatusConst, UserRole, VehicleType } from "../../domain/enums";
import { listOffersByTripPost } from "../../firestore/offers";
import {
  createTripPost,
  getTripPostById,
  listPublicTripBoardPosts,
  listTripPostsByTraveler,
  updateTripPostStatusAsAdmin,
  updateTripPostStatusForTraveler,
} from "../../firestore/tripPosts";
import { getUserById } from "../../firestore/users";
import { getVehicleById } from "../../firestore/vehicles";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { HttpError } from "../../utils/httpError";
import { moneyToString } from "../../utils/money";
import { parseVehicleTypesJson } from "../../utils/jsonArrays";

export const tripPostsRouter = Router();

const vehicleTypeZ = z.enum([
  VehicleType.BIKE,
  VehicleType.CAR,
  VehicleType.JEEP,
  VehicleType.TRAVELLER,
  VehicleType.BUS,
]);

function tripPostMatchesQuery(
  p: { title: string; destinationLabel: string; pickupAddress: string; description: string | null },
  q: string,
): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  const hay = `${p.title} ${p.destinationLabel} ${p.pickupAddress} ${p.description ?? ""}`.toLowerCase();
  return hay.includes(needle);
}

tripPostsRouter.get(
  "/mine",
  requireAuth(UserRole.TRAVELER, UserRole.PROVIDER, UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    if (!req.auth) {
      throw new HttpError(401, "Unauthorized");
    }
    const posts = await listTripPostsByTraveler(req.auth.userId);
    const items = await Promise.all(
      posts.map(async (p) => {
        const traveler = await getUserById(p.travelerId);
        return {
          id: p.id,
          title: p.title,
          description: p.description,
          destinationLabel: p.destinationLabel,
          pickupAddress: p.pickupAddress,
          startDate: p.startDate,
          endDate: p.endDate,
          numPeople: p.numPeople,
          budgetMin: moneyToString(p.budgetMin),
          budgetMax: moneyToString(p.budgetMax),
          preferredTypes: parseVehicleTypesJson(p.preferredTypes),
          status: p.status,
          createdAt: p.createdAt,
          traveler: traveler
            ? {
                id: traveler.id,
                name: traveler.name,
                photoUrl: traveler.photoUrl,
                phone: traveler.phone,
              }
            : { id: p.travelerId, name: "", photoUrl: null, phone: null },
          offersCount: p.offersCount,
        };
      }),
    );
    res.json({ items });
  }),
);

tripPostsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = z.object({ q: z.string().max(120).optional() }).parse(req.query);
    const posts = (await listPublicTripBoardPosts()).filter((p) =>
      query.q?.trim() ? tripPostMatchesQuery(p, query.q.trim()) : true,
    );

    const items = await Promise.all(
      posts.map(async (p) => {
        const traveler = await getUserById(p.travelerId);
        return {
          id: p.id,
          title: p.title,
          description: p.description,
          destinationLabel: p.destinationLabel,
          pickupAddress: p.pickupAddress,
          startDate: p.startDate,
          endDate: p.endDate,
          numPeople: p.numPeople,
          budgetMin: moneyToString(p.budgetMin),
          budgetMax: moneyToString(p.budgetMax),
          preferredTypes: parseVehicleTypesJson(p.preferredTypes),
          status: p.status,
          createdAt: p.createdAt,
          traveler: traveler
            ? {
                id: traveler.id,
                name: traveler.name,
                photoUrl: traveler.photoUrl,
                phone: traveler.phone,
              }
            : { id: p.travelerId, name: "", photoUrl: null, phone: null },
          offersCount: p.offersCount,
        };
      }),
    );

    res.json({ items });
  }),
);

const createTripPostSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(2000).optional(),
  destinationLabel: z.string().min(2).max(120),
  pickupAddress: z.string().min(3).max(240),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  numPeople: z.number().int().positive().max(200),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  preferredTypes: z.array(vehicleTypeZ).max(5).optional(),
});

tripPostsRouter.post(
  "/",
  requireAuth(UserRole.TRAVELER, UserRole.PROVIDER, UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    if (!req.auth) {
      throw new HttpError(401, "Unauthorized");
    }

    const body = createTripPostSchema.parse(req.body);
    if (body.endDate <= body.startDate) {
      throw new HttpError(400, "endDate must be after startDate");
    }

    const post = await createTripPost({
      travelerId: req.auth.userId,
      title: body.title,
      description: body.description,
      destinationLabel: body.destinationLabel,
      pickupAddress: body.pickupAddress,
      startDate: body.startDate,
      endDate: body.endDate,
      numPeople: body.numPeople,
      budgetMin: body.budgetMin,
      budgetMax: body.budgetMax,
      preferredTypes: body.preferredTypes ?? [],
    });

    res.status(201).json({ id: post.id });
  }),
);

const travelerTripStatusZ = z.enum([
  TripPostStatusConst.OPEN,
  TripPostStatusConst.CONTACTED,
  TripPostStatusConst.BOOKED,
  TripPostStatusConst.CANCELLED,
]);

tripPostsRouter.patch(
  "/:id/status",
  requireAuth(UserRole.TRAVELER, UserRole.PROVIDER, UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    if (!req.auth) {
      throw new HttpError(401, "Unauthorized");
    }
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    const body = z.object({ status: travelerTripStatusZ }).parse(req.body);

    try {
      const updated =
        req.auth.role === UserRole.ADMIN
          ? await updateTripPostStatusAsAdmin(params.id, body.status)
          : await updateTripPostStatusForTraveler(params.id, req.auth.userId, body.status);
      res.json({ id: updated.id, status: updated.status, updatedAt: updated.updatedAt });
    } catch (e) {
      if (e instanceof Error && e.message === "NOT_FOUND") {
        throw new HttpError(404, "Trip post not found");
      }
      if (e instanceof Error && e.message === "FORBIDDEN") {
        throw new HttpError(403, "Forbidden");
      }
      throw e;
    }
  }),
);

tripPostsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    const post = await getTripPostById(params.id);

    if (!post) {
      throw new HttpError(404, "Trip post not found");
    }

    const [traveler, offers] = await Promise.all([getUserById(post.travelerId), listOffersByTripPost(post.id)]);

    const offersOut = await Promise.all(
      offers.map(async (o) => {
        const [provider, vehicle] = await Promise.all([
          getUserById(o.providerId),
          o.vehicleId ? getVehicleById(o.vehicleId) : Promise.resolve(null),
        ]);
        return {
          id: o.id,
          quotedPrice: o.quotedPrice > 0 ? moneyToString(o.quotedPrice) : null,
          message: o.message,
          status: o.status,
          createdAt: o.createdAt,
          provider: provider
            ? { id: provider.id, name: provider.name, photoUrl: provider.photoUrl, phone: provider.phone }
            : { id: o.providerId, name: "", photoUrl: null, phone: null },
          vehicle: vehicle
            ? {
                id: vehicle.id,
                brand: vehicle.brand,
                model: vehicle.model,
                type: vehicle.type,
                seatingCapacity: vehicle.seatingCapacity,
              }
            : null,
        };
      }),
    );

    res.json({
      id: post.id,
      title: post.title,
      description: post.description,
      destinationLabel: post.destinationLabel,
      pickupAddress: post.pickupAddress,
      startDate: post.startDate,
      endDate: post.endDate,
      numPeople: post.numPeople,
      budgetMin: moneyToString(post.budgetMin),
      budgetMax: moneyToString(post.budgetMax),
      preferredTypes: post.preferredTypes,
      status: post.status,
      createdAt: post.createdAt,
      traveler: traveler
        ? { id: traveler.id, name: traveler.name, photoUrl: traveler.photoUrl, phone: traveler.phone }
        : { id: post.travelerId, name: "", photoUrl: null, phone: null },
      offers: offersOut,
    });
  }),
);
