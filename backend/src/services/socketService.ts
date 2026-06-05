import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { logger } from "../utils/logger";

export class SocketService {
  private static io: Server | null = null;

  /**
   * Initializes the Socket.io Server with CORS configurations.
   */
  public static init(server: HTTPServer): Server {
    this.io = new Server(server, {
      cors: {
        origin: "*", // allow connecting from frontend clients
        methods: ["GET", "POST"],
      },
    });

    this.io.on("connection", (socket: Socket) => {
      logger.info(`Socket client connected: ${socket.id}`);

      // 1. Join user-specific room (for routing private notifications)
      socket.on("join_user", (userId: string) => {
        socket.join(`user:${userId}`);
        logger.debug(`Socket ${socket.id} joined room: user:${userId}`);
      });

      // 2. Join booking-specific room (for tracking provider live path)
      socket.on("join_booking", (bookingId: string) => {
        socket.join(`booking:${bookingId}`);
        logger.debug(`Socket ${socket.id} joined room: booking:${bookingId}`);
      });

      // 3. Provider location updates: Broadcast to customers in active bookings
      socket.on("update_location", (data: { providerId: string; bookingId: string; latitude: number; longitude: number }) => {
        const { bookingId, latitude, longitude, providerId } = data;
        logger.debug(`Location update from provider ${providerId} for booking ${bookingId}: Lat ${latitude}, Lon ${longitude}`);
        
        // Emit coordinates directly to the booking room
        this.io?.to(`booking:${bookingId}`).emit("location_changed", {
          providerId,
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
        });
      });

      // 4. Handle Disconnect
      socket.on("disconnect", () => {
        logger.info(`Socket client disconnected: ${socket.id}`);
      });
    });

    return this.io;
  }

  /**
   * Emit events to a specific user (either customer, provider, or admin).
   */
  public static emitToUser(userId: string, eventName: string, data: any): void {
    if (!this.io) {
      logger.warn("Socket.io not initialized. Cannot emit message.");
      return;
    }
    this.io.to(`user:${userId}`).emit(eventName, data);
    logger.debug(`Emitted socket event '${eventName}' to room user:${userId}`);
  }

  /**
   * Emit events to everyone tracking a booking (e.g. state change alerts).
   */
  public static emitToBooking(bookingId: string, eventName: string, data: any): void {
    if (!this.io) {
      logger.warn("Socket.io not initialized. Cannot emit message.");
      return;
    }
    this.io.to(`booking:${bookingId}`).emit(eventName, data);
    logger.debug(`Emitted socket event '${eventName}' to room booking:${bookingId}`);
  }

  /**
   * Broadcast events globally (e.g. system broadcast).
   */
  public static broadcast(eventName: string, data: any): void {
    if (!this.io) {
      logger.warn("Socket.io not initialized. Cannot broadcast message.");
      return;
    }
    this.io.emit(eventName, data);
    logger.debug(`Broadcasted global socket event: ${eventName}`);
  }
}
