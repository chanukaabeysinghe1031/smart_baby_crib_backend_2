import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import { swaggerUi, swaggerSpec } from "./swaggerConfig.js";
import mqtt from "mqtt";
import {
  setupWebSocket,
  websocketRouter,
  setupMQTT,
} from "./routes/websocket.routes.js";

// Import Routes
import ecbUserRegistration from "./routes/ecbUserRegistration.routes.js";
import ecbDeviceRegistration from "./routes/ecbDeviceRegistration.routes.js";
import ecbWeightHistorical from "./routes/ecbWeightHistorical.routes.js";
import ecbWeightCurrent from "./routes/ecbWeightCurrent.routes.js";
import ecbLengthHistorical from "./routes/ecbLengthHistorical.routes.js";
import ecbLengthCurrent from "./routes/ecbLengthCurrent.routes.js";
import ecbTempHistorical from "./routes/ecbTempHistorical.routes.js";
import ecbTempCurrent from "./routes/ecbTempCurrent.routes.js";
import ecbAINanny from "./routes/ecbAINanny.routes.js";
import ecbGpsTrackCurrent from "./routes/ecbGpsTrackCurrent.routes.js";
import ecbFingerPrintCurrent from "./routes/ecbFingerPrintCurrent.routes.js";
import ecbAINotes from "./routes/ecbAINotes.routes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

console.log("===========================================");
console.log("MONGODB URI : " + process.env.MONGODB);
console.log("===========================================");

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGODB ||
      "mongodb+srv://admin:admin@cluster0.yk4m9vr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() =>
    console.log(
      "************************Connected to MongoDB Atlas************************"
    )
  )
  .catch((err) =>
    console.error(
      " *********************** MongoDB connection error *****************************:",
      err
    )
  );

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// REST API Routes
app.use("/api/user", ecbUserRegistration);
app.use("/api/device", ecbDeviceRegistration);
app.use("/api/weight/current", ecbWeightCurrent);
app.use("/api/weight/historical", ecbWeightHistorical);
app.use("/api/length/current", ecbLengthCurrent);
app.use("/api/length/historical", ecbLengthHistorical);
app.use("/api/temp/current", ecbTempCurrent);
app.use("/api/temp/historical", ecbTempHistorical);
app.use("/api/ainanny", ecbAINanny);
app.use("/api/gps/current", ecbGpsTrackCurrent);
app.use("/api/fingerprint/current", ecbFingerPrintCurrent);
app.use("/api/notes", ecbAINotes);
app.use("/api/websocket", websocketRouter);

// MQTT and WebSocket Setup
const mqttManagers = new Map(); // Store managers for multiple users if needed

const initializeMQTTManager = (userId) => {
  if (!mqttManagers.has(userId)) {
    const manager = new MQTTWebSocketManager(userId);
    manager.setupMQTTConnection();
    mqttManagers.set(userId, manager);
  }
};

// Create HTTP Server
const server = app.listen(port, () => {
  console.log("Server is running on port ${port}");
});

// Setup web socket
// setupMQTT(server);

// Setup WebSocket
setupWebSocket(server);
