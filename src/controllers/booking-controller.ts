import { AuthenticatedRequest } from "@/middlewares";
import bookingService from "@/services/booking-service";
import { Response } from "express";
import httpStatus from "http-status";

export async function findBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  //const userId = 1;
  try {
    const booking = await bookingService.findBooking(userId);

    return res.status(httpStatus.OK).send(booking);
  } catch (error) {
    return res.sendStatus(httpStatus.NOT_FOUND);
  }
}

export async function postBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { roomId } = req.body;
  try {
    const booking = await bookingService.postBooking(userId, roomId);
    return res.status(httpStatus.OK).send(booking);
  } catch (error) {
    console.log(error);
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
    else {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
  }
}

