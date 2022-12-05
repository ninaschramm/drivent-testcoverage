import { prisma } from "@/config";

export async function createBookingWithRoomId(roomId: number, userId: number) {
  return prisma.booking.create(
    {
      data: {
        roomId,
        userId
      } }
  );
}
