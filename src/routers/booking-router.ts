import { Router } from "express";
import { authenticateToken } from "@/middlewares";
import { } from "@/controllers";

const bookingRouter = Router();

bookingRouter
  //.all("/*", authenticateToken)
  .get("/", )
  .post("/", )
  .put("/:bookingId", );

export { bookingRouter };
