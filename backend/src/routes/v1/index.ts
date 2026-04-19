import { Router } from "express";
import { authRouter } from "./auth.routes";
import { vehiclesRouter } from "./vehicles.routes";
import { tripPostsRouter } from "./tripPosts.routes";
import { tripJoinRequestsRouter } from "./tripJoinRequests.routes";
import { joinRequestsRouter } from "./joinRequests.routes";
import { offersRouter } from "./offers.routes";
import { bookingsRouter } from "./bookings.routes";
import { messagesRouter } from "./messages.routes";
import { reviewsRouter } from "./reviews.routes";
import { adminRouter } from "./admin.routes";

export const v1Router = Router();

v1Router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

v1Router.use("/auth", authRouter);
v1Router.use("/vehicles", vehiclesRouter);
v1Router.use("/trip-posts", tripPostsRouter);
v1Router.use("/join-requests", joinRequestsRouter);
v1Router.use("/trip-posts/:tripPostId/join-requests", tripJoinRequestsRouter);
v1Router.use("/trip-posts/:tripPostId/offers", offersRouter);
v1Router.use("/bookings", bookingsRouter);
v1Router.use("/messages", messagesRouter);
v1Router.use("/reviews", reviewsRouter);
v1Router.use("/admin", adminRouter);
