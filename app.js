import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { swaggerUi, swaggerSpec } from "./swaggerConfig.js";

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

dotenv.config();

const app = express();
// Connect to MongoDB
mongoose
  .connect("mongodb+srv://admin:admin@cluster0.yk4m9vr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB Atlas", err);
  });
app.use(bodyParser.json());

// Swagger documentation setup
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware for JWT token authentication
const jwtAuth = (req, res, next) => {
  const token = req.header("X-API-TOKEN");

  if (token !== process.env.API_TOKEN) {
    return res.status(403).json({
      message: "Authentication failed. Invalid or missing API token.",
    });
  }

  next();
};

app.use("/api/user", ecbUserRegistration);
app.use("/api/weight/current", ecbWeightCurrent);
app.use("/api/length/historical", ecbLengthHistorical);
app.use("/api/device", ecbDeviceRegistration);
app.use("/api/gps/current", ecbGpsTrackCurrent);
app.use("/api/fingerprint/current", ecbFingerPrintCurrent);
app.use("/api/temp/current", ecbTempCurrent);
app.use("/api/length/current", ecbLengthCurrent);
app.use("/api/ainanny", ecbAINanny);
app.use("/api/weight/historical", ecbWeightHistorical);
app.use("/api/temp/historical", ecbTempHistorical);

if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
