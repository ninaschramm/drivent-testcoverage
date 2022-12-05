import app, { init } from "@/app";
import { prisma } from "@/config";
import faker from "@faker-js/faker";
import { TicketStatus } from "@prisma/client";
import e from "express";
import httpStatus from "http-status";
import { any, number } from "joi";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import {
  createEnrollmentWithAddress,
  createUser,
  createTicketType,
  createTicket,
  createPayment,
  generateCreditCardData,
  createTicketTypeWithHotel,
  createTicketTypeRemote,
  createHotel,
  createRoomWithHotelId,
} from "../factories";
import { createBookingWithRoomId } from "../factories/booking-factory";
import { cleanDb, generateValidToken } from "../helpers";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("GET /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/booking");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 404 when user has no booking", async () => {      
      const user = await createUser();
      const token = await generateValidToken(user);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 200 and bookingId with Room info when user has booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const createdHotel = await createHotel();
      const createdRoom = await createRoomWithHotelId(createdHotel.id);
      const booking = await createBookingWithRoomId(createdRoom.id, user.id);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.OK);

      expect(response.body).toEqual(
        {
          id: booking.id,
          Room: {
            id: createdRoom.id,
            name: createdRoom.name,
            capacity: createdRoom.capacity,
            hotelId: createdHotel.id,
            createdAt: createdRoom.createdAt.toISOString(),
            updatedAt: createdRoom.updatedAt.toISOString(),
          }
        }
      );
    });
  });
});

describe("POST /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.post("/booking");
  
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  
  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();
  
    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
  
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  
  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
  
    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
  
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  
  describe("when token is valid", () => {
    it("should respond with status 404 if roomId does not exist", async () => {      
      const user = await createUser();
      const token = await generateValidToken(user);          
  
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: 0 });
  
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 403 if user does not have a valid ticket", async () => {      
      const user = await createUser();
      const token = await generateValidToken(user);         
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 if users ticket isn't paid", async () => {      
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 when room is full", async () => {      
      const user = await createUser();
      const token = await generateValidToken(user);         
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);

      for (let i=0; i<room.capacity; i++)
      {
        await createBookingWithRoomId(room.id, user.id);
      }     

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });
  
    it("should respond with status 200 and bookingId", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
  
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });
  
      expect(response.status).toEqual(httpStatus.OK);
  
      expect(response.body).toMatchObject(
        {
          id: expect.any(Number)
        }
      );
    });
  });
});

describe("PUT /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const user = await createUser();
    const createdHotel = await createHotel();
    const createdRoom = await createRoomWithHotelId(createdHotel.id);
    const booking = await createBookingWithRoomId(createdRoom.id, user.id);

    const response = await server.put(`/booking/${booking.id}`);
  
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  
  it("should respond with status 401 if given token is not valid", async () => {
    const user = await createUser();
    const createdHotel = await createHotel();
    const createdRoom = await createRoomWithHotelId(createdHotel.id);
    const booking = await createBookingWithRoomId(createdRoom.id, user.id);
    const token = faker.lorem.word();
  
    const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`);
  
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  
  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const createdHotel = await createHotel();
    const createdRoom = await createRoomWithHotelId(createdHotel.id);
    const booking = await createBookingWithRoomId(createdRoom.id, userWithoutSession.id);
  
    const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`);
  
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  
  describe("when token is valid", () => {
    it("should respond with status 404 if roomId does not exist", async () => {      
      const user = await createUser();
      const token = await generateValidToken(user);
      const createdHotel = await createHotel();
      const createdRoom = await createRoomWithHotelId(createdHotel.id);
      const booking = await createBookingWithRoomId(createdRoom.id, user.id);     
  
      const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send({ roomId: 0 });
  
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 404 if bookingId does not exist", async () => {      
      const user = await createUser();
      const token = await generateValidToken(user);
      const createdHotel = await createHotel();
      const createdRoom = await createRoomWithHotelId(createdHotel.id);    
  
      const response = await server.put("/booking/0").set("Authorization", `Bearer ${token}`).send({ roomId: createdRoom.id });
  
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 403 if user does not have a valid ticket", async () => {      
      const user = await createUser();
      const token = await generateValidToken(user);
      const createdHotel = await createHotel();
      const createdRoom = await createRoomWithHotelId(createdHotel.id);
      const booking = await createBookingWithRoomId(createdRoom.id, user.id);

      const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send({ roomId: createdRoom.id });

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 when room is full", async () => {      
      const user = await createUser();
      const token = await generateValidToken(user);         
      const hotel = await createHotel();
      const newRoom = await createRoomWithHotelId(hotel.id);
      const createdRoom = await createRoomWithHotelId(hotel.id);
      const booking = await createBookingWithRoomId(createdRoom.id, user.id);

      for (let i=0; i<newRoom.capacity; i++)
      {
        await createBookingWithRoomId(newRoom.id, user.id);
      }     

      const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send({ roomId: newRoom.id });

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });
  
    it("should respond with status 200 and bookingId", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);      
      const createdHotel = await createHotel();
      const createdRoom = await createRoomWithHotelId(createdHotel.id);
      const newRoom = await createRoomWithHotelId(createdHotel.id);
      const booking = await createBookingWithRoomId(createdRoom.id, user.id);
  
      const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send({ roomId: newRoom.id });
  
      expect(response.status).toEqual(httpStatus.OK);
  
      expect(response.body).toMatchObject(
        {
          id: expect.any(Number)
        }
      );
    });
  });
});
