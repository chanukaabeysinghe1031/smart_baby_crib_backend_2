// webSocketRoutes.js
import express from "express";
import mqtt from "mqtt";
import WebSocket from "ws";
import ecbStrollerStatus from "../models/ecbStrollerStatus.model.js";
import jwtAuth from "../jwtAuth.js"; // Import the JWT middleware

const router = express.Router();

// MQTT Client Setup
const mqttClient = mqtt.connect({
  host: "2a5fd801f5304348ba68615833f3f501.s1.eu.hivemq.cloud",
  port: 8883,
  protocol: "mqtts",
  username: "Protonest",
  password: "kobve3-Rudmug-tidkax",
  rejectUnauthorized: true,
});

let strollerStatus = {
  mode: "Manual",
  status: "All good",
  distance: 0,
  gpsHistory: [],
  remote: "phone",
  halted: false,
  temperature: null,
  humidity: null,
  steering: null,
};

// MQTT Topics
const topics = {
  gps: `stroller/gps`,
  status: `stroller/status`,
  tempHumidity: `stroller/temp_humidity`,
  commands: `backend/commands`,
};

// Subscribe to stroller topics
mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");

  const subscribeTopics = [topics.gps, topics.status, topics.tempHumidity];

  subscribeTopics.forEach((topic) => {
    mqttClient.subscribe(topic, (err) => {
      if (!err) {
        console.log(`Subscribed to ${topic} topic`);
      } else {
        console.error(`Subscription error for topic ${topic}:`, err);
      }
    });
  });
});

// Handle MQTT connection errors
mqttClient.on("error", (error) => {
  console.error("MQTT Connection Error:", error);
});

mqttClient.on("reconnect", () => {
  console.log("Reconnecting to MQTT broker...");
});

mqttClient.on("offline", () => {
  console.log("MQTT client is offline");
});

const saveInitialStatus = async (userId) => {
  try {
    const data = new ecbStrollerStatus({ userId, ...strollerStatus });
    const newData = await data.save();
    return await data.save();
  } catch (err) {
    throw new Error(err.message);
  }
};

// MQTT Subscription and Handlers
mqttClient.on("connect", async () => {
  console.log("Connected to MQTT broker");
  const subscribeTopics = [topics.gps, topics.status, topics.tempHumidity];
  subscribeTopics.forEach((topic) => mqttClient.subscribe(topic));
});

mqttClient.on("message", (topic, message) => {
  const data = JSON.parse(message.toString());
  if (topic === topics.gps) handleGPSData(data);
  if (topic === topics.status) handleStatusUpdate(data);
  if (topic === topics.tempHumidity) handleTempHumidityUpdate(data);
});

// Handle incoming MQTT messages from the stroller
mqttClient.on("message", (topic, message) => {
  console.log(`Received message on topic ${topic}: ${message.toString()}`);

  if (topic === topics.gps) {
    handleGPSData(JSON.parse(message.toString()));
  } else if (topic === topics.status) {
    handleStatusUpdate(JSON.parse(message.toString()));
  } else if (topic === topics.tempHumidity) {
    handleTempHumidityUpdate(JSON.parse(message.toString()));
  }
});

// Handle incoming GPS data
function handleGPSData({ latitude, longitude }) {
  console.log("Handling GPS data...");
  if (strollerStatus.halted) {
    console.log("Distance tracking is halted. Ignoring GPS data.");
    return;
  }

  const gpsHistory = strollerStatus.gpsHistory;
  if (gpsHistory.length > 0) {
    const lastLocation = gpsHistory[gpsHistory.length - 1];
    const distance = calculateDistance(
      lastLocation.latitude,
      lastLocation.longitude,
      latitude,
      longitude
    );
    strollerStatus.distance += distance; // Add calculated distance
  } else {
    console.log("GPS history is empty. This is the first data point.");
  }

  gpsHistory.push({ latitude, longitude });
  strollerStatus.gpsHistory = gpsHistory.slice(-50); // Keep last 50 locations for efficiency

  console.log(`GPS Data: Lat=${latitude}, Lon=${longitude}`);
  console.log(`Updated Distance: ${strollerStatus.distance.toFixed(2)} meters`);

  // Broadcast the updated distance and GPS data to WebSocket clients
  broadcastWS({
    type: "update",
    data: {
      latitude,
      longitude,
      distance: strollerStatus.distance,
    },
  });
}

function handleStatusUpdate({ status }) {
  strollerStatus.status = status;
}

function handleTempHumidityUpdate({ temperature, humidity }) {
  strollerStatus.temperature = temperature;
  strollerStatus.humidity = humidity;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371e3; // Earth's radius in meters
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// WebSocket Setup
let wss;
function setupWebSocket(server) {
  wss = new WebSocket.Server({ server });
  wss.on("connection", (ws) => {
    ws.send(JSON.stringify({ type: "initial", data: strollerStatus }));
    ws.on("message", (message) => console.log("WS Received:", message));
  });
}

function broadcastWS(message) {
  if (wss) {
    const data = JSON.stringify(message);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) client.send(data);
    });
  }
}

// Function to send commands to the stroller
function sendCommand(command) {
  console.log(`Sending command to stroller: ${JSON.stringify(command)}`);
  mqttClient.publish(topics.commands, JSON.stringify(command), (err) => {
    if (err) {
      console.error("Failed to publish command:", err);
    } else {
      console.log("Command published successfully");
    }
  });
}

// REST API Routes
// 1. Initialize Stroller
// 1. Initialize Stroller
router.post("/initialize", jwtAuth, async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).send({
      success: false,
      message: "User ID is required to initialize the stroller.",
    });
  }

  try {
    // Check if a record with the userId already exists
    const existingStroller = await checkIfStrollerExists(userId);

    if (existingStroller) {
      return res.status(400).send({
        success: false,
        message: "A stroller has already been initialized for this user.",
      });
    }

    // Save initial status if no record exists
    const initializedStroller = await saveInitialStatus(userId);
    res.status(201).send({
      success: true,
      message: "Stroller initialized successfully.",
      data: initializedStroller,
    });
  } catch (error) {
    console.error("Error initializing stroller:", error.message);
    res.status(500).send({
      success: false,
      message: "Failed to initialize stroller.",
    });
  }
});

// 2. Set Stroller Mode
router.post("/mode", jwtAuth, async (req, res) => {
  const { userId, mode } = req.body;

  console.log("KKKKKKKKKK");
  // Validate the mode
  if (!["Manual", "Auto", "AutoStroll"].includes(mode)) {
    return res.status(400).send({
      success: false,
      message: "Invalid mode. Mode must be Manual, Auto, or AutoStroll.",
    });
  }

  if (!userId) {
    return res.status(400).send({
      success: false,
      message: "User ID is required to update the stroller mode.",
    });
  }

  try {
    sendCommand({ type: "mode", value: mode });

    // Find the existing stroller data by userId
    const strollerData = await ecbStrollerStatus.findOne({ userId });

    if (!strollerData) {
      return res.status(404).send({
        success: false,
        message: "Stroller data not found for the provided user ID.",
      });
    }

    // Update the mode in memory
    strollerStatus.mode = mode;

    // Broadcast the mode change to WebSocket clients
    broadcastWS({
      type: "modeChange",
      data: {
        mode,
        message: "Stroller mode updated successfully",
      },
    });

    res.status(200).send({
      success: true,
      message: "Stroller mode updated successfully.",
    });
  } catch (error) {
    console.error("Error updating stroller mode:", error.message);
    res.status(500).send({
      success: false,
      message: "Failed to update stroller mode.",
    });
  }
});

// 3. Set Stroller Speed
router.post("/speed", jwtAuth, async (req, res) => {
  const { userId, speed } = req.body;
  console.log(`Received request to set speed to: ${speed} for user: ${userId}`);

  // Validate the speed
  if (![0, 7, 10, 15].includes(speed)) {
    console.error("Invalid speed received");
    return res.status(400).send({ success: false, message: "Invalid speed" });
  }

  if (!userId) {
    return res.status(400).send({
      success: false,
      message: "User ID is required to update the stroller speed.",
    });
  }

  try {
    // Find the existing stroller data by userId
    const strollerData = await ecbStrollerStatus.findOne({ userId });

    if (!strollerData) {
      return res.status(404).send({
        success: false,
        message: "Stroller data not found for the provided user ID.",
      });
    }

    // Update the speed in memory
    strollerStatus.speed = speed;

    // Publish the speed change to MQTT
    sendCommand({ type: "speed", value: speed, userId: userId });

    // Update the speed in the database
    strollerData.speed = speed;
    await strollerData.save();

    console.log(`Stroller speed updated to: ${speed} for user: ${userId}`);
    res
      .status(200)
      .send({ success: true, message: "Speed updated successfully." });
  } catch (error) {
    console.error("Error updating stroller speed:", error.message);
    res.status(500).send({
      success: false,
      message: "Failed to update speed in the database.",
    });
  }
});

// 4. Reset Distance Counter
router.post("/distance/reset", jwtAuth, async (req, res) => {
  const { userId } = req.body;
  console.log("Received request to reset distance");

  if (!userId) {
    return res.status(400).send({
      success: false,
      message: "User ID is required to reset the distance.",
    });
  }

  try {
    // Fetch the existing stroller data using userId
    const strollerData = await ecbStrollerStatus.findOne({ userId });

    if (!strollerData) {
      return res.status(404).send({
        success: false,
        message: "Stroller data not found for the provided user ID.",
      });
    }

    // Reset distance and GPS history in memory
    strollerStatus.distance = 0;
    strollerStatus.gpsHistory = [];

    // Reset distance and GPS history in the database
    strollerData.distance = 0;
    strollerData.gpsHistory = [];
    await strollerData.save();

    console.log(`Distance reset successfully for user: ${userId}`);
    res.status(200).send({
      success: true,
      message: "Distance reset successfully.",
    });
  } catch (error) {
    console.error("Error resetting distance:", error.message);
    res.status(500).send({
      success: false,
      message: "Failed to reset distance in the database.",
    });
  }
});

// 5. Halt Distance Tracking
router.post("/distance/halt", jwtAuth, async (req, res) => {
  const { userId } = req.body;
  console.log("Received request to halt distance tracking");

  if (!userId) {
    return res.status(400).send({
      success: false,
      message: "User ID is required to halt distance tracking.",
    });
  }

  try {
    // Fetch the existing stroller data using userId
    const strollerData = await ecbStrollerStatus.findOne({ userId });

    if (!strollerData) {
      return res.status(404).send({
        success: false,
        message: "Stroller data not found for the provided user ID.",
      });
    }

    // Update halted status in memory
    strollerStatus.halted = true;

    // Update halted status in the database
    strollerData.halted = true;
    await strollerData.save();

    console.log(`Distance tracking halted for user: ${userId}`);
    res.status(200).send({
      success: true,
      message: "Distance tracking halted successfully.",
    });
  } catch (error) {
    console.error("Error halting distance tracking:", error.message);
    res.status(500).send({
      success: false,
      message: "Failed to halt distance tracking in the database.",
    });
  }
});

// 6. Resume Distance Tracking
router.post("/distance/resume", jwtAuth, async (req, res) => {
  const { userId } = req.body;
  console.log("Received request to resume distance tracking");

  if (!userId) {
    return res.status(400).send({
      success: false,
      message: "User ID is required to resume distance tracking.",
    });
  }

  try {
    // Fetch the existing stroller data using userId
    const strollerData = await ecbStrollerStatus.findOne({ userId });

    if (!strollerData) {
      return res.status(404).send({
        success: false,
        message: "Stroller data not found for the provided user ID.",
      });
    }

    // Update the halted status in memory
    strollerStatus.halted = false;

    // Update the halted status in the database
    strollerData.halted = false;
    await strollerData.save();

    console.log(`Distance tracking resumed for user: ${userId}`);
    res.status(200).send({
      success: true,
      message: "Distance tracking resumed successfully.",
    });
  } catch (error) {
    console.error("Error resuming distance tracking:", error.message);
    res.status(500).send({
      success: false,
      message: "Failed to resume distance tracking in the database.",
    });
  }
});

// 7. Get Current Distance
router.get("/distance", jwtAuth, async (req, res) => {
  const { userId } = req.query; // Assuming userId is passed as a query parameter
  console.log("Received request to get current distance");

  if (!userId) {
    return res.status(400).send({
      success: false,
      message: "User ID is required to get the distance.",
    });
  }

  try {
    // Fetch the existing stroller data using userId
    const strollerData = await ecbStrollerStatus.findOne({ userId });

    if (!strollerData) {
      return res.status(404).send({
        success: false,
        message: "Stroller data not found for the provided user ID.",
      });
    }

    console.log(`Fetched distance for user: ${userId}`);
    res.status(200).send({
      success: true,
      distance: strollerData.distance || 0, // Return the distance or 0 if undefined
    });
  } catch (error) {
    console.error("Error fetching distance:", error.message);
    res.status(500).send({
      success: false,
      message: "Failed to fetch the distance from the database.",
    });
  }
});

// 8. Get Current Stroller Status
router.get("/status", jwtAuth, async (req, res) => {
  const { userId } = req.query; // Assuming userId is passed as a query parameter
  console.log("Received request to get stroller status");

  // Validate userId
  if (!userId) {
    return res.status(400).send({
      success: false,
      message: "User ID is required to fetch stroller status.",
    });
  }

  try {
    // Fetch the existing stroller status using userId
    const strollerData = await ecbStrollerStatus.findOne({ userId });

    if (!strollerData) {
      return res.status(404).send({
        success: false,
        message: "Stroller status not found for the provided user ID.",
      });
    }

    sendCommand({ type: "status", value: strollerData, userId: userId });

    console.log(`Fetched stroller status for user: ${userId}`);
    res.status(200).send({
      success: true,
      data: strollerData, // Return the stroller status data
    });
  } catch (error) {
    console.error("Error fetching stroller status:", error.message);
    res.status(500).send({
      success: false,
      message: "Failed to fetch stroller status from the database.",
    });
  }
});

// 9. Set Steering Value
router.post("/steer", jwtAuth, async (req, res) => {
  const { userId, steering } = req.body; // Expecting userId and steering in the request body
  console.log(`Received steering command for user ${userId}: ${steering}`);

  // Validate userId
  if (!userId) {
    return res.status(400).send({
      success: false,
      message: "User ID is required to update steering.",
    });
  }

  // Validate steering
  if (typeof steering !== "number" || steering < -100 || steering > 100) {
    console.error("Invalid steering value received");
    return res
      .status(400)
      .send({ success: false, message: "Invalid steering value" });
  }

  try {
    // Fetch existing stroller data for the user
    const strollerData = await ecbStrollerStatus.findOne({ userId });

    if (!strollerData) {
      return res.status(404).send({
        success: false,
        message: "Stroller status not found for the provided user ID.",
      });
    }

    // Update the steering value in the database
    strollerData.steering = steering;
    await strollerData.save();

    // Publish the steering command
    sendCommand({ type: "steer", value: steering });

    console.log(`Steering updated for user ${userId}: ${steering}`);
    res.status(200).send({
      success: true,
      message: "Steering updated successfully.",
    });
  } catch (error) {
    console.error("Error updating steering:", error.message);
    res.status(500).send({
      success: false,
      message: "Failed to update steering in the database.",
    });
  }
});

// 10. Get Temperature and Humidity
router.get("/temp_humidity", jwtAuth, async (req, res) => {
  const { userId } = req.query; // Expecting userId in the query parameters

  console.log(
    `Received request to get temperature and humidity for user ${userId}`
  );

  // Validate userId
  if (!userId) {
    return res.status(400).send({
      success: false,
      message: "User ID is required to fetch temperature and humidity.",
    });
  }

  try {
    // Fetch existing stroller data for the user
    const strollerData = await ecbStrollerStatus.findOne({ userId });

    if (!strollerData) {
      return res.status(404).send({
        success: false,
        message: "Stroller status not found for the provided user ID.",
      });
    }

    sendCommand({ type: "StrollerData", value: strollerData, userId: userId });

    // Respond with temperature and humidity
    res.status(200).send({
      success: true,
      temperature: strollerData.temperature,
      humidity: strollerData.humidity,
    });
  } catch (error) {
    console.error("Error fetching temperature and humidity:", error.message);
    res.status(500).send({
      success: false,
      message: "Failed to fetch temperature and humidity from the database.",
    });
  }
});

// 11. Set Remote Control (Phone or Ring)
router.post("/remote", jwtAuth, async (req, res) => {
  const { userId, remote } = req.body;

  console.log(
    `Received request to set remote control to: ${remote} for user ${userId}`
  );

  // Validate input
  if (!userId) {
    return res.status(400).send({
      success: false,
      message: "User ID is required to set remote control.",
    });
  }

  if (!["phone", "ring"].includes(remote)) {
    console.error("Invalid remote control option received");
    return res
      .status(400)
      .send({ success: false, message: "Invalid remote control option." });
  }

  try {
    // Fetch existing stroller data for the user
    const strollerData = await ecbStrollerStatus.findOne({ userId });

    if (!strollerData) {
      return res.status(404).send({
        success: false,
        message: "Stroller status not found for the provided user ID.",
      });
    }

    // Update the remote field
    strollerData.remote = remote;
    await strollerData.save();

    // Optionally send a command to the hardware
    sendCommand({ type: "remote", value: remote, userId: userId });

    console.log(`Remote control updated to: ${remote} for user ${userId}`);
    res.status(200).send({
      success: true,
      message: "Remote control updated successfully.",
      data: { userId, remote },
    });
  } catch (error) {
    console.error("Error updating remote control option:", error.message);
    res.status(500).send({
      success: false,
      message: "Failed to update remote control option.",
    });
  }
});

// 12. Update Temperature and Humidity
router.put("/temp_humidity", jwtAuth, async (req, res) => {
  const { userId, temperature, humidity } = req.body; // Expecting these in the request body

  console.log(
    `Received request to update temperature and humidity for user ${userId}`
  );

  // Validate input
  if (!userId || temperature == null || humidity == null) {
    return res.status(400).send({
      success: false,
      message: "User ID, temperature, and humidity are required to update.",
    });
  }

  try {
    // Fetch existing stroller data for the user
    const strollerData = await ecbStrollerStatus.findOne({ userId });

    if (!strollerData) {
      return res.status(404).send({
        success: false,
        message: "Stroller status not found for the provided user ID.",
      });
    }

    // Update the temperature and humidity
    strollerData.temperature = temperature;
    strollerData.humidity = humidity;
    await strollerData.save();

    res.status(200).send({
      success: true,
      message: "Temperature and humidity updated successfully.",
    });
  } catch (error) {
    console.error("Error updating temperature and humidity:", error.message);
    res.status(500).send({
      success: false,
      message: "Failed to update temperature and humidity in the database.",
    });
  }
});

export { router as websocketRouter, setupWebSocket };
