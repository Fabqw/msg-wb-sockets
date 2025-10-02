import express from "express";
import logger from "morgan";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { initDb } from "./db.js";
import { setupSocket } from "./socket.js";
import usersRouter from "./routes/users.js";
import roomsRouter from "./routes/rooms.js";
import messagesRouter from "./routes/messages.js";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import yaml from "yaml";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const port = process.env.PORT || 3000;

const app = express();

app.use(logger("dev"));
app.use(express.json());

// CORS configurado para producción
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

const swaggerPath = join(__dirname, "..", "swagger.yml");
let swaggerDocument;
try {
  swaggerDocument = yaml.parse(fs.readFileSync(swaggerPath, "utf8"));
} catch (error) {
  console.warn("No se pudo cargar swagger.yml:", error.message);
  swaggerDocument = {
    openapi: "3.0.0",
    info: {
      title: "Chat API",
      version: "1.0.0",
      description: "API para chat en tiempo real",
    },
    paths: {},
  };
}

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/users", usersRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/messages", messagesRouter);

app.get("/", (req, res) =>
  res.json({
    message: "Chat WebSocket API",
    status: "running",
    docs: `${req.protocol}://${req.get("host")}/api-docs`,
  })
);

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Crear servidor HTTP y Socket.IO
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

process.on("uncaughtException", (error) => {
  console.error("Error no capturado:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Promesa rechazada no manejada:", reason);
});

(async () => {
  try {
    console.log("Inicializando base de datos...");
    await initDb();
    console.log("Base de datos inicializada");

    console.log("Configurando Socket.IO...");
    setupSocket(io);
    console.log("Socket.IO configurado");

    server.listen(port, "0.0.0.0", () => {
      console.log(`Servidor corriendo en puerto ${port}`);
      console.log(`Documentación Swagger disponible en /api-docs`);
    });
  } catch (error) {
    console.error("Error al inicializar el servidor:", error);
    process.exit(1);
  }
})();
