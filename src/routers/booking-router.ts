import { Router } from "express";
import { authenticateToken } from "@/middlewares";
import { findBooking, postBooking } from "@/controllers/booking-controller";

const bookingRouter = Router();

bookingRouter
  .all("/*", authenticateToken)
  .get("/", findBooking)
  .post("/", postBooking)
  .put("/:bookingId", );

export { bookingRouter };
