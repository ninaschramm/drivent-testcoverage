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

const bookingRepository = {
  findBooking,
  postBooking,
  countBookings
};

export default bookingRepository;
