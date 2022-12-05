import { prisma } from "@/config";
import { Prisma } from "@prisma/client";

async function findBooking(userId: number) {
  return prisma.booking.findFirst({
    where: {
      userId,
    },
    select: {
      id: true,
      Room: true
    }    
  });
}

async function postBooking(data: Prisma.BookingUncheckedCreateInput) {
  return prisma.booking.create({
    data
  });
}

async function countBookings(roomId: number) {
  return prisma.booking.count({
    where: {
      roomId,
    }
  });
}

async function findBookingById(bookingId: number) {
  return prisma.booking.findFirst({
    where: {
      id: bookingId
    }
  });
}

async function updateBooking(bookingId: number, roomId: number) {
  return prisma.booking.update({
    where: {
      id: bookingId,
    },
    data: {
      roomId: roomId,
    },
  });
}

const bookingRepository = {
  findBooking,
  postBooking,
  countBookings,
  findBookingById,
  updateBooking
};

export default bookingRepository;
