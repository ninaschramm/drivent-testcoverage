import bookingRepository from "@/repositories/booking-repository";
import { notFoundError } from "@/errors";

async function findBooking(userId: number) {
  const booking = await bookingRepository.findBooking(userId);
  if (!booking) {
    throw notFoundError();
  }
  
  return booking;
}

const hotelService = {
  findBooking,
};

export default hotelService;
