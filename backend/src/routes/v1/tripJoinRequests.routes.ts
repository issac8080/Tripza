import { Router } from "express";
import { z } from "zod";
import { OfferStatus as OfferStatusConst, TripPostStatus, UserRole } from "../../domain/enums";
import {
  createTripJoinRequest,
  findPendingJoinRequest,
  getJoinRequestById,
  listJoinRequestsByTripPost,
  sumAcceptedSeatsForTrip,
  updateJoinRequestStatus,
  type TripJoinRequestRow,
} from "../../firestore/tripJoinRequests";
import { getTripPostById } from "../../firestore/tripPosts";
import { getUserById } from "../../firestore/users";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { HttpError } from "../../utils/httpError";

export const tripJoinRequestsRouter = Router({ mergeParams: true });

async function serializeJoinRequestRow(r: TripJoinRequestRow) {
  const u = await getUserById(r.requesterId);
  return {
    id: r.id,
    tripPostId: r.tripPostId,
    seatsRequested: r.seatsRequested,
    message: r.message,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    requester: u
      ? { id: u.id, name: u.name, photoUrl: u.photoUrl, phone: u.phone }
      : { id: r.requesterId, name: "", photoUrl: null, phone: null },
  };
}

tripJoinRequestsRouter.get(
  "/",
  requireAuth(UserRole.TRAVELER, UserRole.PROVIDER, UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    const auth = req.auth;
    if (!auth) {
      throw new HttpError(401, "Unauthorized");
    }
    const params = z.object({ tripPostId: z.string().min(1) }).parse(req.params);
    const trip = await getTripPostById(params.tripPostId);
    if (!trip) {
      throw new HttpError(404, "Trip post not found");
    }

    const rows = await listJoinRequestsByTripPost(params.tripPostId);
    const isOwner = trip.travelerId === auth.userId;
    const isAdmin = auth.role === UserRole.ADMIN;

    if (isOwner || isAdmin) {
      const items = await Promise.all(rows.map((r) => serializeJoinRequestRow(r)));
      res.json({ items });
      return;
    }

    const mine = rows.filter((r) => r.requesterId === auth.userId);
    const items = await Promise.all(mine.map((r) => serializeJoinRequestRow(r)));
    res.json({ items });
  }),
);

const createJoinSchema = z.object({
  seatsRequested: z.number().int().positive().max(200),
  message: z.string().max(2000).optional(),
});

tripJoinRequestsRouter.post(
  "/",
  requireAuth(UserRole.TRAVELER, UserRole.PROVIDER, UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    if (!req.auth) {
      throw new HttpError(401, "Unauthorized");
    }
    const params = z.object({ tripPostId: z.string().min(1) }).parse(req.params);
    const body = createJoinSchema.parse(req.body);

    const trip = await getTripPostById(params.tripPostId);
    if (!trip) {
      throw new HttpError(404, "Trip post not found");
    }
    if (trip.travelerId === req.auth.userId) {
      throw new HttpError(400, "You cannot request your own trip");
    }
    if (trip.status !== TripPostStatus.OPEN && trip.status !== TripPostStatus.CONTACTED) {
      throw new HttpError(400, "This trip is not accepting requests");
    }
    if (body.seatsRequested > trip.numPeople) {
      throw new HttpError(400, "Seats requested exceeds seats offered on the trip");
    }

    const existing = await findPendingJoinRequest(params.tripPostId, req.auth.userId);
    if (existing) {
      throw new HttpError(409, "You already have a pending request for this trip");
    }

    const created = await createTripJoinRequest({
      tripPostId: params.tripPostId,
      requesterId: req.auth.userId,
      seatsRequested: body.seatsRequested,
      message: body.message,
    });

    res.status(201).json({ id: created.id, status: OfferStatusConst.PENDING });
  }),
);

tripJoinRequestsRouter.post(
  "/:joinRequestId/withdraw",
  requireAuth(UserRole.TRAVELER, UserRole.PROVIDER, UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    if (!req.auth) {
      throw new HttpError(401, "Unauthorized");
    }
    const params = z.object({ tripPostId: z.string().min(1), joinRequestId: z.string().min(1) }).parse({
      ...req.params,
      joinRequestId: req.params.joinRequestId,
    });

    const jr = await getJoinRequestById(params.joinRequestId);
    if (!jr || jr.tripPostId !== params.tripPostId) {
      throw new HttpError(404, "Join request not found");
    }
    if (jr.requesterId !== req.auth.userId) {
      throw new HttpError(403, "Only the requester can withdraw");
    }

    try {
      const updated = await updateJoinRequestStatus(params.joinRequestId, OfferStatusConst.WITHDRAWN);
      res.json({ id: updated.id, status: updated.status, updatedAt: updated.updatedAt });
    } catch (e) {
      if (e instanceof Error && e.message === "NOT_FOUND") {
        throw new HttpError(404, "Join request not found");
      }
      if (e instanceof Error && e.message === "INVALID_STATE") {
        throw new HttpError(400, "Request is no longer pending");
      }
      throw e;
    }
  }),
);

const patchJoinSchema = z.object({
  status: z.enum([OfferStatusConst.ACCEPTED, OfferStatusConst.REJECTED]),
});

tripJoinRequestsRouter.patch(
  "/:joinRequestId",
  requireAuth(UserRole.TRAVELER, UserRole.PROVIDER, UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    if (!req.auth) {
      throw new HttpError(401, "Unauthorized");
    }
    const params = z.object({ tripPostId: z.string().min(1), joinRequestId: z.string().min(1) }).parse({
      ...req.params,
      joinRequestId: req.params.joinRequestId,
    });
    const body = patchJoinSchema.parse(req.body);

    const trip = await getTripPostById(params.tripPostId);
    if (!trip) {
      throw new HttpError(404, "Trip post not found");
    }
    if (req.auth.role !== UserRole.ADMIN && trip.travelerId !== req.auth.userId) {
      throw new HttpError(403, "Only the trip host can accept or reject requests");
    }

    const jr = await getJoinRequestById(params.joinRequestId);
    if (!jr || jr.tripPostId !== params.tripPostId) {
      throw new HttpError(404, "Join request not found");
    }

    if (body.status === OfferStatusConst.ACCEPTED) {
      const admitted = await sumAcceptedSeatsForTrip(params.tripPostId);
      if (admitted + jr.seatsRequested > trip.numPeople) {
        throw new HttpError(400, "Not enough seats left to accept this request");
      }
    }

    try {
      const updated = await updateJoinRequestStatus(params.joinRequestId, body.status);
      res.json({
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updatedAt,
      });
    } catch (e) {
      if (e instanceof Error && e.message === "NOT_FOUND") {
        throw new HttpError(404, "Join request not found");
      }
      if (e instanceof Error && e.message === "INVALID_STATE") {
        throw new HttpError(400, "Request is no longer pending");
      }
      throw e;
    }
  }),
);
