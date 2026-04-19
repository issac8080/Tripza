import { Router } from "express";
import { z } from "zod";
import { BookingStatus, UserRole } from "../../domain/enums";
import { aggregateReviewsForVehicle, createReview, listReviewsByVehicle } from "../../firestore/reviews";
import { getBookingById } from "../../firestore/bookings";
import { getUserById } from "../../firestore/users";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { HttpError } from "../../utils/httpError";
export const reviewsRouter = Router();

reviewsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = z
      .object({
        vehicleId: z.string().min(1),
      })
      .parse(req.query);

    const [reviews, aggregates] = await Promise.all([
      listReviewsByVehicle(query.vehicleId),
      aggregateReviewsForVehicle(query.vehicleId),
    ]);

    const items = await Promise.all(
      reviews.map(async (r) => {
        const [reviewer, booking] = await Promise.all([getUserById(r.reviewerId), getBookingById(r.bookingId)]);
        return {
          id: r.id,
          vehicleScore: r.vehicleScore,
          driverScore: r.driverScore,
          tags: r.tags,
          body: r.body,
          photoUrls: r.photoUrls,
          createdAt: r.createdAt,
          reviewer: reviewer
            ? { id: reviewer.id, name: reviewer.name, photoUrl: reviewer.photoUrl }
            : { id: r.reviewerId, name: "", photoUrl: null },
          booking: booking
            ? { id: booking.id, startAt: booking.startAt, endAt: booking.endAt }
            : { id: r.bookingId, startAt: new Date(), endAt: new Date() },
        };
      }),
    );

    res.json({
      summary: {
        count: aggregates.count,
        avgVehicle: aggregates.avgVehicle,
        avgDriver: aggregates.avgDriver,
      },
      items,
    });
  }),
);

const createReviewSchema = z.object({
  bookingId: z.string().min(1),
  vehicleScore: z.number().int().min(1).max(5),
  driverScore: z.number().int().min(1).max(5),
  tags: z.array(z.string().min(1).max(40)).max(12).optional(),
  body: z.string().max(2000).optional(),
  photoUrls: z.array(z.string().url()).max(8).optional(),
});

reviewsRouter.post(
  "/",
  requireAuth(UserRole.TRAVELER, UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    if (!req.auth) {
      throw new HttpError(401, "Unauthorized");
    }

    const body = createReviewSchema.parse(req.body);

    const booking = await getBookingById(body.bookingId);
    if (!booking) {
      throw new HttpError(404, "Booking not found");
    }
    if (booking.travelerId !== req.auth.userId && req.auth.role !== UserRole.ADMIN) {
      throw new HttpError(403, "Only the traveler can review this booking");
    }
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new HttpError(400, "Booking must be completed before leaving a review");
    }

    const tags = body.tags ?? [];
    const photoUrls = body.photoUrls ?? [];

    try {
      const review = await createReview({
        bookingId: booking.id,
        reviewerId: req.auth.userId,
        vehicleId: booking.vehicleId,
        vehicleScore: body.vehicleScore,
        driverScore: body.driverScore,
        tags,
        photoUrls,
        body: body.body,
      });
      res.status(201).json({ id: review.id });
    } catch (e: unknown) {
      if (typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "DUPLICATE_REVIEW") {
        throw new HttpError(409, "You already reviewed this booking");
      }
      throw e;
    }
  }),
);
