"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment configurations before any package imports
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const db_1 = require("./config/db");
const socketService_1 = require("./services/socketService");
const routes_1 = __importDefault(require("./routes"));
const error_1 = require("./middlewares/error");
const logger_1 = require("./utils/logger");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// 1. Initialise Socket.io
socketService_1.SocketService.init(server);
// 2. Security & Parsing Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: "*", // Adjust origins in production
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// 3. API Gateway Routing
app.use("/api/v1", routes_1.default);
// 4. Fallback for unhandled endpoints
app.all("*", (req, _res, next) => {
    const err = new Error(`Cannot find ${req.originalUrl} on this server.`);
    err.statusCode = 404;
    next(err);
});
// 5. Centralised Exception Handling Middleware
app.use(error_1.errorHandler);
const PORT = process.env.PORT || 5000;
// 6. Connect to PostgreSQL and bootstrap
const startServer = async () => {
    await (0, db_1.connectDB)();
    server.listen(PORT, () => {
        logger_1.logger.info(`===================================================`);
        logger_1.logger.info(` AtoZ Works Backend listening on port: ${PORT} `);
        logger_1.logger.info(` Environment: ${process.env.NODE_ENV || "development"} `);
        logger_1.logger.info(`===================================================`);
    });
};
startServer().catch((err) => {
    logger_1.logger.error("Initialization failure on startup boot:", err);
    process.exit(1);
});
// Handle graceful system shutdown
process.on("SIGTERM", () => {
    logger_1.logger.info("SIGTERM signal received: closing HTTP server...");
    server.close(() => {
        logger_1.logger.info("HTTP server closed cleanly.");
        process.exit(0);
    });
});
