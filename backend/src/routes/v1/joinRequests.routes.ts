import { Router } from "express";
import { UserRole } from "../../domain/enums";
import { getTripPostById } from "../../firestore/tripPosts";
import { getUserById } from "../../firestore/users";
import { listJoinRequestsByRequester } from "../../firestore/tripJoinRequests";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { HttpError } from "../../utils/httpError";
import { moneyToString } from "../../utils/money";
import { parseVehicleTypesJson } from "../../utils/jsonArrays";

export const joinRequestsRouter = Router();

joinRequestsRouter.get(
  "/mine",
  requireAuth(UserRole.TRAVELER, UserRole.PROVIDER, UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    if (!req.auth) {
      throw new HttpError(401, "Unauthorized");
    }
    const rows = await listJoinRequestsByRequester(req.auth.userId);
    const items = await Promise.all(
      rows.map(async (r) => {
        const trip = await getTripPostById(r.tripPostId);
        const host = trip ? await getUserById(trip.travelerId) : null;
        return {
          id: r.id,
          tripPostId: r.tripPostId,
          seatsRequested: r.seatsRequested,
          message: r.message,
          status: r.status,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          trip: trip
            ? {
                id: trip.id,
                title: trip.title,
                destinationLabel: trip.destinationLabel,
                pickupAddress: trip.pickupAddress,
                startDate: trip.startDate,
                endDate: trip.endDate,
                numPeople: trip.numPeople,
                status: trip.status,
                budgetMin: moneyToString(trip.budgetMin),
                budgetMax: moneyToString(trip.budgetMax),
                preferredTypes: parseVehicleTypesJson(trip.preferredTypes),
                host: host
                  ? { id: host.id, name: host.name, phone: host.phone }
                  : { id: trip.travelerId, name: "", phone: null },
              }
            : null,
        };
      }),
    );
    res.json({ items });
  }),
);
