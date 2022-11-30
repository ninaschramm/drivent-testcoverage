import { prisma } from "@/config";
import { Prisma } from "@prisma/client";

async function findBooking(userId: number) {
  return prisma.booking.findFirst({
    where: {
      userId,
    },
    include: {
      Room: true
    }
  });
}

async function postBooking(data: Prisma.BookingUncheckedCreateInput) {
  return prisma.booking.create({
    data
  });
}

const bookingRepository = {
  findBooking,
  postBooking,
};

export default bookingRepository;
