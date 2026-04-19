import { Router } from "express";
import { z } from "zod";
import { TripPostStatus, UserRole } from "../../domain/enums";
import { createOffer } from "../../firestore/offers";
import { getTripPostById } from "../../firestore/tripPosts";
import { assertVehicleOwnedBy } from "../../firestore/vehicles";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { HttpError } from "../../utils/httpError";

export const offersRouter = Router({ mergeParams: true });

const createOfferSchema = z.object({
  /** Optional quote; 0 means “discuss on call / WhatsApp”. */
  quotedPrice: z.number().nonnegative().optional().default(0),
  message: z.string().max(2000).optional(),
  vehicleId: z.string().optional(),
});

offersRouter.post(
  "/",
  requireAuth(UserRole.PROVIDER, UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    if (!req.auth) {
      throw new HttpError(401, "Unauthorized");
    }

    const params = z.object({ tripPostId: z.string().min(1) }).parse(req.params);
    const body = createOfferSchema.parse(req.body);

    const trip = await getTripPostById(params.tripPostId);
    if (!trip || trip.status !== TripPostStatus.OPEN) {
      throw new HttpError(404, "Trip post is not open for offers");
    }

    if (body.vehicleId) {
      try {
        await assertVehicleOwnedBy(body.vehicleId, req.auth.userId);
      } catch {
        throw new HttpError(400, "vehicleId must belong to the authenticated provider");
      }
    }

    const offer = await createOffer({
      tripPostId: params.tripPostId,
      providerId: req.auth.userId,
      vehicleId: body.vehicleId,
      quotedPrice: body.quotedPrice,
      message: body.message,
    });

    res.status(201).json({ id: offer.id });
  }),
);
