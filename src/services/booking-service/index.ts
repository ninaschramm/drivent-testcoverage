import bookingRepository from "@/repositories/booking-repository";
import { notFoundError } from "@/errors";
import ticketRepository from "@/repositories/ticket-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import { forbiddenError } from "@/errors/forbidden-error";
import { Prisma } from "@prisma/client";
import hotelRepository from "@/repositories/hotel-repository";

async function findBooking(userId: number) {
  const booking = await bookingRepository.findBooking(userId);
  if (!booking) {
    throw notFoundError();
  }
  
  return booking;
}

async function postBooking(userId: number, roomId: number) {
  const room = await hotelRepository.findRoomById(roomId);
  if (!room) {
    throw notFoundError();
  }
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) {
    throw forbiddenError();
  }
  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket || ticket.TicketType.includesHotel !== true || ticket.TicketType.isRemote !== false || ticket.status !== "PAID" ) {
    throw forbiddenError();
  }
  const checkAvailability = await bookingRepository.countBookings(room.id) < room.capacity;
  if (!checkAvailability) {
    throw forbiddenError();
  }

  const data: Prisma.BookingUncheckedCreateInput = {
    userId,
    roomId
  };

  const booking = await bookingRepository.postBooking(data);
  console.log(booking);
  return booking;
}

const bookingService = {
  findBooking,
  postBooking
};

export default bookingService;
