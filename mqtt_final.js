import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mqtt from "mqtt";
import WebSocket from "ws";
import fs from "fs";
import path from "path";

const app = express();
const port = 3000;
const strollerId = "11";

// MQTT Topics
const topics = {
  gps: `stroller/${strollerId}/gps`,
  status: `stroller/${strollerId}/status`,
  tempHumidity: `stroller/${strollerId}/temp_humidity`,
  commands: `backend/${strollerId}/commands`,
};
// Middleware
app.use(bodyParser.json());
app.use(cors());

// MQTT Client Setup
const mqttClient = mqtt.connect({
  host: "2a5fd801f5304348ba68615833f3f501.s1.eu.hivemq.cloud", // Your MQTT broker address
  port: 8883, // Use 8883 for TLS
  protocol: "mqtts",
  username: "Protonest",
  password: "kobve3-Rudmug-tidkax",
  rejectUnauthorized: true,
});

// Data Store
let strollerStatus = {
  mode: "Manual",
  status: "All good",
  distance: 0, // Total distance in meters
  gpsHistory: [], // Array to store GPS history
  remote: "phone",
  halted: false, // Indicates if distance tracking is halted
  temperature: null,
  humidity: null,
  steering: null,
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

// Function to calculate distance using the Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  console.log(
    `Calculating distance between (${lat1}, ${lon1}) and (${lat2}, ${lon2})`
  );
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371e3; // Earth's radius in meters
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in meters
  console.log(`Calculated distance: ${distance} meters`);
  return distance;
}

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

// Handle status updates from the stroller
function handleStatusUpdate({ status }) {
  console.log("Handling status update...");
  strollerStatus.status = status;

  // Broadcast the updated status to WebSocket clients
  broadcastWS({
    type: "status",
    data: { status },
  });
}

// Handle temperature and humidity updates
function handleTempHumidityUpdate({ temperature, humidity }) {
  console.log("Handling temperature and humidity update...");
  strollerStatus.temperature = temperature;
  strollerStatus.humidity = humidity;

  // Broadcast the updated temp and humidity to WebSocket clients
  broadcastWS({
    type: "tempHumidity",
    data: { temperature, humidity },
  });
}

// Function to send commands to the stroller
function sendCommand(command, topics) {
  console.log(`Sending command to stroller: ${JSON.stringify(command)}`);
  mqttClient.publish(topics.commands, JSON.stringify(command), (err) => {
    if (err) {
      console.error("Failed to publish command:", err);
    } else {
      console.log("Command published successfully");
    }
  });
}

// WebSocket Server Setup
console.log("Setting up WebSocket server...");
const server = app.listen(port, () => {
  console.log(`Backend server is running on port ${port}`);
});

const wss = new WebSocket.Server({ server });

wss.on("listening", () => {
  console.log("WebSocket server is listening for connections");
});

// Function to broadcast messages to all connected WebSocket clients
function broadcastWS(message) {
  console.log(
    `Broadcasting message to WebSocket clients: ${JSON.stringify(message)}`
  );
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("WebSocket client connected");

  // Send initial status to the client
  ws.send(
    JSON.stringify({
      type: "initial",
      data: strollerStatus,
    })
  );

  ws.on("message", (message) => {
    console.log("Received from WebSocket client:", message);
  });

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// REST API Endpoints

// 1. Set Stroller Mode
app.post("/api/mode", (req, res) => {
  const { mode } = req.body;
  console.log(`Received request to set mode to: ${mode}`);

  if (!["Manual", "Auto", "AutoStroll"].includes(mode)) {
    console.error("Invalid mode received");
    return res.status(400).send({ success: false, message: "Invalid mode" });
  }

  strollerStatus.mode = mode;
  sendCommand({ type: "mode", value: mode }, topics);

  res.status(200).send({ success: true });
});

// 2. Set Stroller Speed
app.post("/api/speed", (req, res) => {
  const { speed } = req.body;
  console.log(`Received request to set speed to: ${speed}`);

  if (![0, 7, 10, 15].includes(speed)) {
    console.error("Invalid speed received");
    return res.status(400).send({ success: false, message: "Invalid speed" });
  }

  // MQTT Topics
  const topics = {
    gps: `stroller/${strollerId}/gps`,
    status: `stroller/${strollerId}/status`,
    tempHumidity: `stroller/${strollerId}/temp_humidity`,
    commands: `backend/${strollerId}/commands`,
  };
  sendCommand({ type: "speed", value: speed }, topics);

  res.status(200).send({ success: true });
});

// 3. Reset Distance Counter
app.post("/api/distance/reset", (req, res) => {
  console.log("Received request to reset distance");
  strollerStatus.distance = 0;
  strollerStatus.gpsHistory = [];
  res
    .status(200)
    .send({ success: true, message: "Distance reset successfully." });
});

// 4. Halt Distance Tracking
app.post("/api/distance/halt", (req, res) => {
  console.log("Received request to halt distance tracking");
  strollerStatus.halted = true;
  res.status(200).send({ success: true, message: "Distance tracking halted." });
});

// 5. Resume Distance Tracking
app.post("/api/distance/resume", (req, res) => {
  console.log("Received request to resume distance tracking");
  strollerStatus.halted = false;
  res
    .status(200)
    .send({ success: true, message: "Distance tracking resumed." });
});

// 6. Get Current Distance
app.get("/api/distance", (req, res) => {
  console.log("Received request to get current distance");
  res.status(200).send({ success: true, distance: strollerStatus.distance });
});

// 7. Get Current Stroller Status
app.get("/api/status", (req, res) => {
  console.log("Received request to get stroller status");
  res.status(200).send({ success: true, data: strollerStatus });
});

// 8. Set Steering Value
app.post("/api/steer", (req, res) => {
  const { steering } = req.body;
  console.log(`Received steering command: ${steering}`);

  if (typeof steering !== "number" || steering < -100 || steering > 100) {
    console.error("Invalid steering value received");
    return res
      .status(400)
      .send({ success: false, message: "Invalid steering value" });
  }

  strollerStatus.steering = steering;
  sendCommand({ type: "steer", value: steering });

  res.status(200).send({ success: true });
});

// 9. Get Temperature and Humidity
app.get("/api/temp_humidity", (req, res) => {
  console.log("Received request to get temperature and humidity");
  res.status(200).send({
    success: true,
    temperature: strollerStatus.temperature,
    humidity: strollerStatus.humidity,
  });
});

// 10. Set Remote Control (Phone or Ring)
app.post("/api/remote", (req, res) => {
  const { remote } = req.body;
  console.log(`Received request to set remote to: ${remote}`);

  if (!["phone", "ring"].includes(remote)) {
    console.error("Invalid remote control option received");
    return res
      .status(400)
      .send({ success: false, message: "Invalid remote control option" });
  }

  strollerStatus.remote = remote;
  sendCommand({ type: "remote", value: remote });

  res.status(200).send({ success: true });
});
