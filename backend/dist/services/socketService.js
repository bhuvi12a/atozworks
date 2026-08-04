"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketService = void 0;
const socket_io_1 = require("socket.io");
const logger_1 = require("../utils/logger");
class SocketService {
    static io = null;
    /**
     * Initializes the Socket.io Server with CORS configurations.
     */
    static init(server) {
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: "*", // allow connecting from frontend clients
                methods: ["GET", "POST"],
            },
        });
        this.io.on("connection", (socket) => {
            logger_1.logger.info(`Socket client connected: ${socket.id}`);
            // 1. Join user-specific room (for routing private notifications)
            socket.on("join_user", (userId) => {
                socket.join(`user:${userId}`);
                logger_1.logger.debug(`Socket ${socket.id} joined room: user:${userId}`);
            });
            // 2. Join booking-specific room (for tracking provider live path)
            socket.on("join_booking", (bookingId) => {
                socket.join(`booking:${bookingId}`);
                logger_1.logger.debug(`Socket ${socket.id} joined room: booking:${bookingId}`);
            });
            // 3. Provider location updates: Broadcast to customers in active bookings
            socket.on("update_location", (data) => {
                const { bookingId, latitude, longitude, providerId } = data;
                logger_1.logger.debug(`Location update from provider ${providerId} for booking ${bookingId}: Lat ${latitude}, Lon ${longitude}`);
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
                logger_1.logger.info(`Socket client disconnected: ${socket.id}`);
            });
        });
        return this.io;
    }
    /**
     * Emit events to a specific user (either customer, provider, or admin).
     */
    static emitToUser(userId, eventName, data) {
        if (!this.io) {
            logger_1.logger.warn("Socket.io not initialized. Cannot emit message.");
            return;
        }
        this.io.to(`user:${userId}`).emit(eventName, data);
        logger_1.logger.debug(`Emitted socket event '${eventName}' to room user:${userId}`);
    }
    /**
     * Emit events to everyone tracking a booking (e.g. state change alerts).
     */
    static emitToBooking(bookingId, eventName, data) {
        if (!this.io) {
            logger_1.logger.warn("Socket.io not initialized. Cannot emit message.");
            return;
        }
        this.io.to(`booking:${bookingId}`).emit(eventName, data);
        logger_1.logger.debug(`Emitted socket event '${eventName}' to room booking:${bookingId}`);
    }
    /**
     * Broadcast events globally (e.g. system broadcast).
     */
    static broadcast(eventName, data) {
        if (!this.io) {
            logger_1.logger.warn("Socket.io not initialized. Cannot broadcast message.");
            return;
        }
        this.io.emit(eventName, data);
        logger_1.logger.debug(`Broadcasted global socket event: ${eventName}`);
    }
}
exports.SocketService = SocketService;
