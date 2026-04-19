import { Router } from "express";
import { z } from "zod";
import { createMessage, listThread } from "../../firestore/messages";
import { getBookingById } from "../../firestore/bookings";
import { findOfferByTripAndProvider } from "../../firestore/offers";
import { getTripPostById } from "../../firestore/tripPosts";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { HttpError } from "../../utils/httpError";
import { emitChatMessage } from "../../socket/emitChat";

export const messagesRouter = Router();

const sendSchema = z.object({
  receiverId: z.string().min(1),
  body: z.string().min(1).max(4000),
  bookingId: z.string().optional(),
  tripPostId: z.string().optional(),
});

messagesRouter.post(
  "/",
  requireAuth(),
  asyncHandler(async (req, res) => {
    if (!req.auth) {
      throw new HttpError(401, "Unauthorized");
    }

    const body = sendSchema.parse(req.body);
    if (!body.bookingId && !body.tripPostId) {
      throw new HttpError(400, "bookingId or tripPostId is required");
    }

    if (body.bookingId) {
      const booking = await getBookingById(body.bookingId);
      if (!booking) {
        throw new HttpError(404, "Booking not found");
      }
      const allowed = new Set([booking.travelerId, booking.providerId]);
      if (!allowed.has(req.auth.userId) || !allowed.has(body.receiverId)) {
        throw new HttpError(403, "Participants must match the booking");
      }
    }

    if (body.tripPostId) {
      const trip = await getTripPostById(body.tripPostId);
      if (!trip) {
        throw new HttpError(404, "Trip post not found");
      }

      const isTraveler = trip.travelerId === req.auth.userId;
      if (isTraveler) {
        const offerToReceiver = await findOfferByTripAndProvider(trip.id, body.receiverId);
        if (!offerToReceiver) {
          throw new HttpError(403, "You can only message providers who submitted an offer");
        }
      } else {
        const myOffer = await findOfferByTripAndProvider(trip.id, req.auth.userId);
        if (!myOffer || body.receiverId !== trip.travelerId) {
          throw new HttpError(403, "Providers must have an offer and message the traveler");
        }
      }
    }

    const message = await createMessage({
      senderId: req.auth.userId,
      receiverId: body.receiverId,
      body: body.body,
      bookingId: body.bookingId,
      tripPostId: body.tripPostId,
    });

    emitChatMessage(message);

    res.status(201).json({ id: message.id, createdAt: message.createdAt });
  }),
);

messagesRouter.get(
  "/thread",
  requireAuth(),
  asyncHandler(async (req, res) => {
    if (!req.auth) {
      throw new HttpError(401, "Unauthorized");
    }

    const query = z
      .object({
        withUserId: z.string().min(1),
        bookingId: z.string().optional(),
        tripPostId: z.string().optional(),
      })
      .refine((q) => Boolean(q.bookingId || q.tripPostId), {
        message: "bookingId or tripPostId is required",
      })
      .parse(req.query);

    const me = req.auth.userId;
    const other = query.withUserId;

    const messages = await listThread({
      me,
      other,
      bookingId: query.bookingId,
      tripPostId: query.tripPostId,
    });

    res.json({ items: messages });
  }),
);
