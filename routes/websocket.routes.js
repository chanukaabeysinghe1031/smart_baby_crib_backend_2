// webSocketRoutes.js
import express from "express";
import mqtt from "mqtt";
import { WebSocketServer } from "ws"; // Correct WebSocket import
import ecbStrollerStatus from "../models/ecbStrollerStatus.model.js";
import jwtAuth from "../jwtAuth.js"; // Import the JWT middleware
import ecbUserRegistration from "../models/ecbUserRegistration.model.js";
import ecbGpsTrackCurrent from "../models/ecbGpsTrackCurrent.model.js";
import WebSocket from "ws";

const router = express.Router();

const wss = new WebSocketServer({ noServer: true });
const userConnections = new Map();

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
  walkingStatus: "initial",
  walk: 0,
};

const mqttConnections = new Map(); // Store MQTT clients by strollerId
let mqttClient;

// ====================================================================
// ======================== UTILITY FUNCTIONS =========================
// ====================================================================
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

function broadcastWS(userId, message) {
  const ws = userConnections.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

// Function to send commands to the stroller
function sendCommand(command, topics) {
  const mqttClient = mqtt.connect({
    host: "2a5fd801f5304348ba68615833f3f501.s1.eu.hivemq.cloud",
    port: 8883,
    protocol: "mqtts",
    username: "Protonest",
    password: "kobve3-Rudmug-tidkax",
    rejectUnauthorized: true,
  });
  console.log(`Sending command to stroller: ${JSON.stringify(command)}`);
  mqttClient.publish(topics.commands, JSON.stringify(command), (err) => {
    if (err) {
      console.error("Failed to publish command:", err);
    } else {
      console.log("Command published successfully");
    }
  });
}

// ====================================================================
// ============= FUNCTIONS TO GET DATA FROM MQTT ======================
// ====================================================================

async function handleGPSData({ latitude, longitude }, userId) {
  console.log("SAVING GPS DATA FROM DEVICE OF USER");

  try {
    const strollerStatus = await ecbStrollerStatus.findOne({ userId });

    if (!strollerStatus) {
      console.log("Stroller data not found for the provided user ID.");
      return;
    }

    if (strollerStatus.halted) {
      console.log("Distance tracking is halted. Ignoring GPS data.");
      return;
    }

    console.log("Handling GPS data...");
    const gpsHistory = strollerStatus.gpsHistory || [];
    const newLatitude = parseFloat(latitude);
    const newLongitude = parseFloat(longitude);
    const currentDateTime = new Date();
    let walkingStatus = strollerStatus?.walkingStatus || "initial";
    let saveLastGPSTrack = false;
    let numberOfWalks = strollerStatus.numberOfWalks || 0;

    if (gpsHistory.length > 0) {
      const lastLocation = gpsHistory[gpsHistory.length - 1];
      const distance = calculateDistance(
        lastLocation.latitude,
        lastLocation.longitude,
        newLatitude,
        newLongitude
      );
      strollerStatus.distance += distance;

      // Get the GPS before 10 minutes before the current time
      // If the distance before last 10 minuts and noe GPS locations are grater than 100m then it will be a walk
      // Calculate the timestamp 10 minutes before
      const targetTimestamp = new Date(
        currentDateTime.getTime() - 1 * 60 * 1000
      );

      // Find the closest GPS point to the target timestamp
      let closestPointBefore10minutes = null;
      let smallestTimeDifference = Infinity;

      gpsHistory.forEach((point) => {
        const pointTimestamp = new Date(point.timestamp);
        const timeDifference = Math.abs(targetTimestamp - pointTimestamp);

        if (timeDifference < smallestTimeDifference) {
          smallestTimeDifference = timeDifference;
          closestPointBefore10minutes = point;
        }
      });

      if (closestPointBefore10minutes) {
        console.log("GPS point 10 minutes before now:", {
          latitude: closestPointBefore10minutes.latitude,
          longitude: closestPointBefore10minutes.longitude,
        });

        let distanceDifferenceFor10minuts = calculateDistance(
          closestPointBefore10minutes.latitude,
          closestPointBefore10minutes.longitude,
          newLatitude,
          newLongitude
        );

        if (distanceDifferenceFor10minuts >= 100) {
          console.log("----------------------------------------------");
          console.log("----------------------------------------------");
          console.log("--------------------- MOVING -----------------");
          console.log("----------------------------------------------");
          console.log("----------------------------------------------");
          console.log("----------------------------------------------");

          walkingStatus = "MOVING_STATE";
        }
      } else {
        walkingStatus = "IDLE";
        console.log("No GPS point found.");
      }

      // If the in MOVING STATE check whether last 10 minutes in same location or in  range of 5m distance
      if (walkingStatus === "MOVING_STATE") {
        // Check whether stroller has been in 5m range for last 30 minutes
        let lastTimestamp = lastLocation.timestamp;
        const timeDifference = Math.abs(currentDateTime - lastTimestamp); // Difference in ms
        if (timeDifference >= 3 * 60 * 1000) {
          console.log(
            "+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"
          );
          console.log(
            "++++++++++++++++++++  NEW WALK +++++++++++++++++++++++++++++++++++++++++++"
          );
          console.log(
            "+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"
          );
          console.log(
            "+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"
          );

          numberOfWalks += 1; // Increment walk count
          walkingStatus = "IDLE";
          saveLastGPSTrack = true;
        }
      }

      // If distance is greater than 5 it will be added to gps history
      if (distance > 5) {
        saveLastGPSTrack = true;
        gpsHistory.push({ latitude: newLatitude, longitude: newLongitude });
      } else {
        console.log(
          "New GPS point is within 5 meters of the last point. Ignoring."
        );
      }
    } else {
      console.log("GPS history is empty. Saving the first data point.");
      gpsHistory.push({ latitude: newLatitude, longitude: newLongitude });
      strollerStatus.gpsHistory = gpsHistory;
    }

    console.log(`GPS Data: Lat=${latitude}, Lon=${longitude}`);
    console.log(
      `Updated Distance: ${strollerStatus.distance.toFixed(2)} meters`
    );

    if (saveLastGPSTrack) {
      const newGPSTrackData = new ecbGpsTrackCurrent({
        sysUserId: userId,
        sysGpsLongitude: newLongitude,
        sysGpsLatitude: newLatitude,
        etlDateTime: currentDateTime,
        numberOfWalks: strollerStatus.numberOfWalks,
        walkingStatus: walkingStatus,
      });

      await newGPSTrackData.save();
    }

    strollerStatus.numberOfWalks = numberOfWalks;
    strollerStatus.walkingStatus = walkingStatus;

    await strollerStatus.save();

    // Broadcast to WebSocket clients
    try {
      broadcastWS(userId, {
        type: "update",
        data: {
          userId: userId,
          latitude: newLatitude,
          longitude: newLongitude,
          distance: strollerStatus.distance,
          numberOfWalks: strollerStatus.numberOfWalks,
        },
      });
    } catch (wsError) {
      console.error("Error broadcasting data:", wsError.message);
    }
  } catch (error) {
    console.error("Error saving GPS data:", error.message);
  }

  console.log("======================================================");
}

async function handleStatusUpdate({ status, userId }) {
  console.log("==========================================");
  try {
    console.log("SAVING STROLLER STATUS FROM DEVICE USERID : " + userId);

    // Find the stroller status by userId
    let strollerStatus = await ecbStrollerStatus.findOne({ userId: userId });

    if (!strollerStatus) {
      // Handle the case where no document is found
      console.log(
        "No existing stroller status found for user. Creating a new record."
      );
      strollerStatus = new ecbStrollerStatus({ userId, status });
    } else {
      // Update the existing status
      strollerStatus.status = status;
    }

    broadcastWS(userId, {
      type: "status",
      data: {
        userId: userId,
        status: status,
      },
    });
    // Save the updated or new document
    await strollerStatus.save();
    console.log("Stroller status saved successfully.");
  } catch (error) {
    console.error("Error saving status:", error.message);
  }
  console.log("==========================================");
}

async function handleTempHumidityUpdate({ temperature, humidity }, userId) {
  console.log("==========================================");
  console.log("SAVING STROLLER STATUS FROM DEVICE");
  try {
    // Find the stroller status by userId
    let strollerStatus = await ecbStrollerStatus.findOne({ userId });

    // If no record exists, handle appropriately
    if (!strollerStatus) {
      console.log(
        "No existing stroller status found for user. Creating a new record."
      );
      strollerStatus = new ecbStrollerStatus({ userId, temperature, humidity });
    } else {
      // Update the existing record
      strollerStatus.temperature = temperature;
      strollerStatus.humidity = humidity;
    }

    broadcastWS(userId, {
      type: "tempHumidity",
      data: {
        userId: userId,
        temperature,
        humidity,
      },
    });
    // Save the record (new or updated)
    await strollerStatus.save();
    console.log("Stroller status saved successfully.");
  } catch (error) {
    console.error("Error saving temperature and humidity:", error.message);
  }
  console.log("==========================================");
}

// ====================================================================
// ============= FUNCTIONS TO GET DATA FROM MQTT ======================
// ====================================================================
// WebSocket Setup
function setupMQTT(userId) {
  console.log("_______________________________________________________");
  console.log("_____________SETTING UP MQTT CONNECTION________________");
  console.log("_______________________________________________________");

  return new Promise((resolve, reject) => {
    const topics = {
      gps: `stroller/${userId}/gps`,
      status: `stroller/${userId}/status`,
      tempHumidity: `stroller/${userId}/temp_humidity`,
      commands: `backend/${userId}/commands`,
    };

    const mqttClient = mqtt.connect({
      host: "2a5fd801f5304348ba68615833f3f501.s1.eu.hivemq.cloud",
      port: 8883,
      protocol: "mqtts",
      username: "Protonest",
      password: "kobve3-Rudmug-tidkax",
      rejectUnauthorized: true,
    });

    mqttClient.on("connect", () => {
      console.log(`Connected to MQTT broker for user ${userId}`);

      const subscribeTopics = [topics.gps, topics.status, topics.tempHumidity];

      subscribeTopics.forEach((topic) => {
        mqttClient.subscribe(topic, (err) => {
          if (err) {
            console.error(`Subscription error for topic ${topic}:`, err);
            reject(new Error(`Subscription failed for topic ${topic}`));
          } else {
            console.log(`Subscribed to topic: ${topic}`);
          }
        });
      });

      resolve({
        success: true,
        message: `MQTT connection initialized for user ${userId}.`,
      });
    });

    mqttClient.on("error", (error) => {
      console.error("MQTT Connection Error:", error);
      reject(new Error("MQTT Connection Error: " + error.message));
    });

    mqttClient.on("offline", () => {
      console.log(`MQTT client is offline for user ${userId}`);
    });

    mqttClient.on("reconnect", () => {
      console.log(`Reconnecting to MQTT broker for user ${userId}...`);
    });

    mqttClient.on("message", (topic, message) => {
      const data = JSON.parse(message.toString());
      console.log(`Message received on topic ${topic}:`, data);

      if (topic === topics.gps) handleGPSData(data, userId);
      if (topic === topics.status) handleStatusUpdate(data, userId);
      if (topic === topics.tempHumidity) handleTempHumidityUpdate(data, userId);
    });
  });
}

// Function to send a message to a specific user
export const sendToUser = (userId, message) => {
  const ws = userConnections.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(userId, JSON.stringify(message));
  }
};

function setupWebSocket(server) {
  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathParts = url.pathname.split("/"); // Split the path into segments
    const userId = pathParts[pathParts.length - 1]; // Extract the last part (userId)

    if (!userId) {
      socket.destroy(); // Close connection if userId is missing
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      ws.userId = userId; // Store userId in WebSocket instance
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (ws) => {
    ws.on("message", async (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        const { type, data } = parsedMessage;
        // Handle specific WebSocket messages

        if (type === "register") {
          const { userId } = data;

          if (!userId) {
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                message: "User ID required for WebSocket registration.",
              })
            );
            return;
          }

          userSockets.set(userId, ws); // Store the WebSocket instance for this userId
          console.log(`User ${userId} registered for WebSocket communication.`);
          ws.send(
            userId,
            JSON.stringify({
              success: true,
              message: `WebSocket registered for user ${userId}`,
            })
          );
        }

        if (type === "modeChange") {
          const { userId, mode } = data;
          console.log("DATA : " + userId);

          if (!userId || !mode) {
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message: "Invalid data format.",
              })
            );
            return;
          }

          console.log(`Received mode update from user ${userId}: ${mode}`);

          // Send the mode to the appropriate MQTT topic
          // MQTT Topics
          const topics = {
            gps: `stroller/${userId}/gps`,
            status: `stroller/${userId}/status`,
            tempHumidity: `stroller/${userId}/temp_humidity`,
            commands: `backend/${userId}/commands`,
          };

          sendCommand(
            {
              type: "mode",
              value: mode,
            },
            topics
          );

          // Optionally, update the database
          const strollerStatus = await ecbStrollerStatus.findOne({ userId });
          if (strollerStatus) {
            strollerStatus.mode = mode;
            await strollerStatus.save();
          }
          broadcastWS(userId, {
            type: "modeChange",
            data: {
              success: true,
              mode,
              userId,
              message: "Stroller mode updated successfully.",
            },
          });
        }

        if (type === "speedChange") {
          const { userId, speed } = data;

          console.log(`Received speed update: ${speed} for user: ${userId}`);

          // Validate the speed
          if (![0, 7, 10, 15].includes(speed)) {
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message: "Invalid speed. Allowed values are 0, 7, 10, 15.",
              })
            );
            return;
          }

          if (!userId) {
            ws.send(
              userId,
              JSON.stringify({
                error: "User ID is required to update the speed.",
              })
            );
            return;
          }

          const userExists = await ecbUserRegistration.findOne({
            sysUserId: userId,
          });
          if (!userExists) {
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message: "User ID does not exist.",
              })
            );
            return;
          }

          const { strollerId } = userExists;

          // MQTT Topics
          const topics = {
            gps: `stroller/${userId}/gps`,
            status: `stroller/${userId}/status`,
            tempHumidity: `stroller/${userId}/temp_humidity`,
            commands: `backend/${userId}/commands`,
          };
          sendCommand({ type: "speed", value: speed }, topics);

          try {
            // Find the existing stroller data by userId
            const strollerData = await ecbStrollerStatus.findOne({ userId });

            if (!strollerData) {
              ws.send(
                userId,
                JSON.stringify({
                  success: false,
                  userId,
                  message: "Stroller data not found for the provided user ID.",
                })
              );
              return;
            }

            console.log("FOUND STROLLER : ", strollerData);
            // Update the speed in memory and database
            strollerStatus.speed = speed;
            strollerData.speed = speed;
            await strollerData.save();

            console.log("OKOKOKOKOKOKOKO" + strollerData.speed);
            // Broadcast to all WebSocket clients
            broadcastWS(userId, {
              type: "speedChange",
              data: {
                success: true,
                speed,
                userId,
                message: "Stroller speed updated successfully.",
              },
            });

            console.log(
              `Stroller speed updated to: ${speed} for user: ${userId}`
            );
          } catch (error) {
            console.error("Error updating stroller speed:", error.message);
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message: "Failed to update speed.",
              })
            );
          }
        } else if (type === "resetDistance") {
          const { userId } = data;
          console.log("Received request to reset distance");

          if (!userId) {
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message: "User ID is required to reset the distance.",
              })
            );
            return;
          }

          const userExists = await ecbUserRegistration.findOne({
            sysUserId: userId,
          }); // Replace UserModel with your actual user model
          if (!userExists) {
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message: "User ID does not exist",
              })
            );
            return;
          }

          const { strollerId } = userExists;

          // MQTT Topics
          const topics = {
            gps: `stroller/${userId}/gps`,
            status: `stroller/${userId}/status`,
            tempHumidity: `stroller/${userId}/temp_humidity`,
            commands: `backend/${userId}/commands`,
          };

          sendCommand(
            {
              type: "resetDistance",
              value: 0,
            },
            topics
          );

          // Broadcast the mode change to WebSocket clients
          broadcastWS(userId, {
            type: "resetDistance",
            data: {
              success: true,
              distance: 0,
              userId,
              message: "Stroller  distance reset successfully",
            },
          });

          try {
            // Fetch the existing stroller data using userId
            const strollerData = await ecbStrollerStatus.findOne({ userId });

            if (!strollerData) {
              ws.send(
                userId,
                JSON.stringify({
                  success: false,
                  userId,
                  message: "Stroller data not found for the provided user ID.",
                })
              );
              return;
            }

            // Reset distance and GPS history in memory
            strollerStatus.distance = 0;
            strollerStatus.gpsHistory = [];

            // Reset distance and GPS history in the database
            strollerData.distance = 0;
            strollerData.gpsHistory = [];
            await strollerData.save();

            console.log(`Distance reset successfully for user: ${userId}`);
          } catch (error) {
            console.error("Error resetting distance:", error.message);
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message: "Failed to reset distance in the database.",
              })
            );
            return;
          }
        } else if (type == "haltDistance") {
          const { userId } = data;
          console.log("Received request to halt distance tracking");

          if (!userId) {
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message: "User ID is required to halt distance tracking",
              })
            );
            return;
          }

          const userExists = await ecbUserRegistration.findOne({
            sysUserId: userId,
          }); // Replace UserModel with your actual user model
          if (!userExists) {
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message: "User ID does not exist",
              })
            );
            return;
          }

          const { strollerId } = userExists;

          // MQTT Topics
          const topics = {
            gps: `stroller/${userId}/gps`,
            status: `stroller/${userId}/status`,
            tempHumidity: `stroller/${userId}/temp_humidity`,
            commands: `backend/${userId}/commands`,
          };

          sendCommand({ type: "halt", value: true }, topics);

          // Broadcast the mode change to WebSocket clients
          broadcastWS(userId, {
            type: "haltDistance",
            data: {
              success: true,
              halted: true,
              userId,
              message: "Tracking stroller  distance is halted successfully",
            },
          });

          try {
            // Fetch the existing stroller data using userId
            const strollerData = await ecbStrollerStatus.findOne({ userId });

            if (!strollerData) {
              ws.send(
                userId,
                JSON.stringify({
                  success: false,
                  userId,
                  message: "Stroller data not found for the provided user ID.",
                })
              );
              return;
            }

            // Update halted status in memory
            strollerStatus.halted = true;

            // Update halted status in the database
            strollerData.halted = true;
            await strollerData.save();

            console.log(`Distance tracking halted for user: ${userId}`);
          } catch (error) {
            console.error("Error halting distance tracking:", error.message);
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message: "Failed to halt distance tracking in the database.",
              })
            );
            return;
          }
        } else if (type == "resumeDistance") {
          const { userId } = data;
          console.log("Received request to resume distance tracking");

          if (!userId) {
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message: "User ID is required to resume distance tracking",
              })
            );
            return;
          }

          const userExists = await ecbUserRegistration.findOne({
            sysUserId: userId,
          }); // Replace UserModel with your actual user model
          if (!userExists) {
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message: "User ID does not exist.",
              })
            );
            return;
          }

          const { strollerId } = userExists;

          // MQTT Topics
          const topics = {
            gps: `stroller/${userId}/gps`,
            status: `stroller/${userId}/status`,
            tempHumidity: `stroller/${userId}/temp_humidity`,
            commands: `backend/${userId}/commands`,
          };

          sendCommand({ type: "resume", value: true }, topics);

          // Broadcast the mode change to WebSocket clients
          broadcastWS(userId, {
            type: "resumeDistance",
            data: {
              halted: false,
              userId,
              message: "Tracking stroller  distance is resumed successfully",
            },
          });

          try {
            // Fetch the existing stroller data using userId
            const strollerData = await ecbStrollerStatus.findOne({ userId });

            if (!strollerData) {
              ws.send(
                userId,
                JSON.stringify({
                  success: false,
                  userId,
                  message: "Stroller data not found for the provided user ID.",
                })
              );
              return;
            }

            // Update the halted status in memory
            strollerStatus.halted = false;

            // Update the halted status in the database
            strollerData.halted = false;
            await strollerData.save();

            console.log(`Distance tracking resumed for user: ${userId}`);
          } catch (error) {
            console.error("Error resuming distance tracking:", error.message);
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message: "Failed to resume distance tracking in the database.",
              })
            );
            return;
          }
        } else if (type == "getDistance") {
          const userId = data; // Assuming userId is passed as a query parameter
          console.log("Received request to get current distance");

          if (!userId) {
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message: "User ID is required to get the distance.",
              })
            );
            return;
          }

          try {
            // Fetch the existing stroller data using userId
            const strollerData = await ecbStrollerStatus.findOne({ userId });

            if (!strollerData) {
              ws.send(
                userId,
                JSON.stringify({
                  success: false,
                  userId,
                  message: "Stroller data not found for the provided user ID",
                })
              );
              return;
            }

            const userExists = await ecbUserRegistration.findOne({
              sysUserId: userId,
            }); // Replace UserModel with your actual user model
            if (!userExists) {
              ws.send(
                userId,
                JSON.stringify({
                  success: false,
                  userId,
                  message: "User ID does not exist.",
                })
              );
              return;
            }

            const { strollerId } = userExists;

            // MQTT Topics
            const topics = {
              gps: `stroller/${userId}/gps`,
              status: `stroller/${userId}/status`,
              tempHumidity: `stroller/${userId}/temp_humidity`,
              commands: `backend/${userId}/commands`,
            };

            sendCommand(
              { type: "distance", value: strollerData.distance || 0 },
              topics
            );
            // Broadcast the mode change to WebSocket clients
            broadcastWS(userId, {
              type: "getDistance",
              data: {
                distance: strollerData.distance || 0,
                userId,
                message: "Stroller  distance is received successfully",
              },
            });

            console.log(`Fetched distance for user: ${userId}`);
            ws.send(
              userId,
              JSON.stringify({
                success: true,
                userId,
                distance: strollerData.distance || 0,
              })
            );
            return;
          } catch (error) {
            console.error("Error fetching distance:", error.message);
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message: "Failed to fetch the distance from the database.",
              })
            );
            return;
          }
        } else if (type === "getStatus") {
          const userId = data; // Assuming userId is passed as a query parameter
          console.log("Received request to get stroller status");

          // Validate userId
          if (!userId) {
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message: "User ID is required to fetch stroller status",
              })
            );
            return;
          }

          try {
            // Fetch the existing stroller status using userId
            const strollerData = await ecbStrollerStatus.findOne({ userId });

            if (!strollerData) {
              ws.send(
                userId,
                JSON.stringify({
                  success: false,
                  userId,
                  message:
                    "Stroller status not found for the provided user ID.",
                })
              );
              return;
            }

            const userExists = await ecbUserRegistration.findOne({
              sysUserId: userId,
            }); // Replace UserModel with your actual user model
            if (!userExists) {
              ws.send(
                userId,
                JSON.stringify({
                  success: false,
                  userId,
                  message: "User ID does not exist.",
                })
              );
              return;
            }

            const { strollerId } = userExists;

            // MQTT Topics
            const topics = {
              gps: `stroller/${userId}/gps`,
              status: `stroller/${userId}/status`,
              tempHumidity: `stroller/${userId}/temp_humidity`,
              commands: `backend/${userId}/commands`,
            };

            sendCommand(
              { type: "status", value: strollerData.status || null },
              topics
            );

            // Broadcast the mode change to WebSocket clients
            broadcastWS(userId, {
              type: "getStatus",
              data: {
                status: strollerData.status || null,
                userId,
                message: "Stroller  status is received successfully",
              },
            });

            console.log(`Fetched stroller status for user: ${userId}`);
          } catch (error) {
            console.error("Error fetching stroller status:", error.message);
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message: "Failed to fetch stroller status from the database.",
              })
            );
            return;
          }
        } else if (type === "setSteering") {
          const { userId, steering } = data; // Expecting userId and steering in the request body
          console.log(
            `Received steering command for user ${userId}: ${steering}`
          );

          // Validate userId
          if (!userId) {
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message: "User ID is required to update steering.",
              })
            );
            return;
          }

          // Validate steering
          if (
            typeof steering !== "number" ||
            steering < -100 ||
            steering > 100
          ) {
            console.error("Invalid steering value received");
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message: "Invalid steering value",
              })
            );
            return;
          }

          const userExists = await ecbUserRegistration.findOne({
            sysUserId: userId,
          }); // Replace UserModel with your actual user model
          if (!userExists) {
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message: "User ID does not exist.",
              })
            );
            return;
          }

          const { strollerId } = userExists;

          // MQTT Topics
          const topics = {
            gps: `stroller/${userId}/gps`,
            status: `stroller/${userId}/status`,
            tempHumidity: `stroller/${userId}/temp_humidity`,
            commands: `backend/${userId}/commands`,
          };

          sendCommand({ type: "steer", value: steering || null }, topics);

          // Broadcast the mode change to WebSocket clients
          broadcastWS(userId, {
            type: "setSteering",
            data: {
              steering: steering,
              userId,
              message: "Stroller  steering is set successfully",
            },
          });

          try {
            // Fetch existing stroller data for the user
            const strollerData = await ecbStrollerStatus.findOne({ userId });

            if (!strollerData) {
              ws.send(
                userId,
                JSON.stringify({
                  success: false,
                  userId,
                  message:
                    "Stroller status not found for the provided user ID.",
                })
              );
              return;
            }

            // Update the steering value in the database
            strollerData.steering = steering;
            // await strollerData.save();

            // MQTT Topics
            const topics = {
              gps: `stroller/${userId}/gps`,
              status: `stroller/${userId}/status`,
              tempHumidity: `stroller/${userId}/temp_humidity`,
              commands: `backend/${userId}/commands`,
            };
            // Publish the steering command
            sendCommand({ type: "steer", value: steering }, topics);

            console.log(`Steering updated for user ${userId}: ${steering}`);
            ws.send(
              userId,
              JSON.stringify({
                success: true,
                userId,
                message: "Steering updated successfully.",
              })
            );
            return;
          } catch (error) {
            console.error("Error updating steering:", error.message);
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message: "Failed to update steering in the database.",
              })
            );
            return;
          }
        } else if (type == "getTempHumidity") {
          const userId = data; // Expecting userId in the query parameters

          console.log(
            `Received request to get temperature and humidity for user ${userId}`
          );

          // Validate userId
          if (!userId) {
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message:
                  "User ID is required to fetch temperature and humidity.",
              })
            );
            return;
          }

          try {
            // Fetch existing stroller data for the user
            const strollerData = await ecbStrollerStatus.findOne({ userId });

            if (!strollerData) {
              ws.send(
                userId,
                JSON.stringify({
                  success: false,
                  userId,
                  message: "Stroller data not found for the provided user ID.",
                })
              );
              return;
            }

            // Broadcast the mode change to WebSocket clients
            broadcastWS(userId, {
              type: "getTempHumidity",
              data: {
                temperature: strollerData.temperature,
                humidity: strollerData.humidity,
                userId,
                message:
                  "Stroller  temperature and humidity are received successfully.",
              },
            });
          } catch (error) {
            console.error(
              "Error fetching temperature and humidity:",
              error.message
            );
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message:
                  "Failed to fetch temperature and humidity from the database.",
              })
            );
            return;
          }
        } else if (type == "setRemote") {
          const { userId, remote } = data;

          console.log(
            `Received request to set remote control to: ${remote} for user ${userId}`
          );

          // Validate input
          if (!userId) {
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message: "User ID is required to set remote control.",
              })
            );
            return;
          }

          if (!["phone", "ring"].includes(remote)) {
            console.error("Invalid remote control option received");
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message: "Invalid remote control option.",
              })
            );
            return;
          }

          const userExists = await ecbUserRegistration.findOne({
            sysUserId: userId,
          }); // Replace UserModel with your actual user model
          if (!userExists) {
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message: "User ID does not exist.",
              })
            );
            return;
          }

          const { strollerId } = userExists;

          // MQTT Topics
          const topics = {
            gps: `stroller/${userId}/gps`,
            status: `stroller/${userId}/status`,
            tempHumidity: `stroller/${userId}/temp_humidity`,
            commands: `backend/${userId}/commands`,
          };

          sendCommand({ type: "remote", value: remote }, topics);

          try {
            // Fetch existing stroller data for the user
            const strollerData = await ecbStrollerStatus.findOne({ userId });

            if (!strollerData) {
              ws.send(
                userId,
                JSON.stringify({
                  success: false,
                  userId,
                  message:
                    "Stroller status not found for the provided user ID.",
                })
              );
              return;
            }

            // Update the remote field
            strollerData.remote = remote;
            await strollerData.save();

            // Broadcast the mode change to WebSocket clients
            broadcastWS(userId, {
              type: "setRemote",
              data: {
                remote: remote,
                userId,
                message: "Stroller remote method set successfully.",
              },
            });

            console.log(
              `Remote control updated to: ${remote} for user ${userId}`
            );
          } catch (error) {
            console.error(
              "Error updating remote control option:",
              error.message
            );
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message: "Failed to update remote control option.",
              })
            );
            return;
          }
        } else if (type == "setTempHumidity") {
          const { userId, temperature, humidity } = req.body; // Expecting these in the request body

          console.log(
            `Received request to update temperature and humidity for user ${userId}`
          );

          // Validate input
          if (!userId || temperature == null || humidity == null) {
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message:
                  "User ID, temperature, and humidity are required to update.",
              })
            );
            return;
          }

          // Broadcast the mode change to WebSocket clients
          broadcastWS(userId, {
            type: "setTempHumidity",
            data: {
              temperature,
              humidity,
              userId,
              message: "Stroller temperature and hunidity set successfully.",
            },
          });

          try {
            // Fetch existing stroller data for the user
            const strollerData = await ecbStrollerStatus.findOne({ userId });

            if (!strollerData) {
              ws.send(
                userId,
                JSON.stringify({
                  success: false,
                  userId,
                  message:
                    "Stroller status not found for the provided user ID.",
                })
              );
              return;
            }

            // Update the temperature and humidity
            strollerData.temperature = temperature;
            strollerData.humidity = humidity;
            await strollerData.save();
          } catch (error) {
            console.error(
              "Error updating temperature and humidity:",
              error.message
            );
            ws.send(
              userId,
              JSON.stringify({
                success: false,
                userId,
                message:
                  "Failed to update temperature and humidity in the database.",
              })
            );
            return;
          }
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error.message);
        ws.send(
          userId,
          JSON.stringify({
            success: false,
            userId,
            message: "Internal server error.",
          })
        );
      }
    });
  });
}

// REST API Routes
// 1. Initialize Stroller
router.post("/initialize", jwtAuth, async (req, res) => {
  const { userId } = req.body;

  // Setup WebSocket
  setupWebSocket(server);

  if (!userId) {
    return res.status(400).send({
      success: false,
      message: "User ID is required to initialize the stroller.",
    });
  }

  if (mqttConnections.has(userId)) {
    return res.status(200).send({
      success: true,
      message: `MQTT connection already exists for strollerId: ${strollerId}.`,
    });
  }
  const mqttResponse = await setupMQTT(userId);
  try {
    console.log("+++++++++++++++++++++++++++++++++++++++++=");
    console.log("+++++++++++++++++++++++++++++++++++++++++=");
    console.log("+++++++++++++++++++++++++++++++++++++++++=");

    const userExists = await ecbUserRegistration.findOne({ sysUserId: userId }); // Replace UserModel with your actual user model
    if (!userExists) {
      return res.status(404).send({
        success: false,
        message: "User ID does not exist.",
      });
    }

    // Check if a stroller status already exists for the userId
    const existingStrollerStatus = await ecbStrollerStatus.findOne({ userId });
    if (existingStrollerStatus) {
      return res.status(200).send({
        success: true,
        message: "Stroller has already been initialized for this user.",
      });
    }

    const data = new ecbStrollerStatus({ userId, ...strollerStatus });
    const newData = await data.save();
    // Broadcast the mode change to WebSocket clients
    broadcastWS(userId, {
      type: "speedChange",
      data: {
        speed,
        userId,
        message: "Stroller speed updated successfully",
      },
    });
    return res
      .status(200)
      .send({ success: true, message: mqttResponse.message });
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

  // Validate the mode
  if (!["Manual", "Auto", "AutoStroll"].includes(mode)) {
    return res.status(400).send({
      success: false,
      message: "Invalid mode. Mode must be Manual, Auto, or AutoStroll.",
    });
  }

  const userExists = await ecbUserRegistration.findOne({ sysUserId: userId }); // Replace UserModel with your actual user model
  if (!userExists) {
    return res.status(404).send({
      success: false,
      message: "User ID does not exist.",
    });
  }

  const { strollerId } = userExists;

  // MQTT Topics
  const topics = {
    gps: `stroller/${userId}/gps`,
    status: `stroller/${userId}/status`,
    tempHumidity: `stroller/${userId}/temp_humidity`,
    commands: `backend/${userId}/commands`,
  };

  sendCommand(
    {
      type: "mode",
      value: mode,
    },
    topics
  );

  if (!userId) {
    return res.status(400).send({
      success: false,
      message: "User ID is required to update the stroller mode.",
    });
  }
  // Broadcast the mode change to WebSocket clients
  broadcastWS(userId, {
    type: "modeChange",
    data: {
      mode,
      value: mode,
    },
  });

  try {
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
    await strollerData.save();

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
  const userExists = await ecbUserRegistration.findOne({ sysUserId: userId }); // Replace UserModel with your actual user model
  if (!userExists) {
    return res.status(404).send({
      success: false,
      message: "User ID does not exist.",
    });
  }

  const { strollerId } = userExists;

  // MQTT Topics
  const topics = {
    gps: `stroller/${userId}/gps`,
    status: `stroller/${userId}/status`,
    tempHumidity: `stroller/${userId}/temp_humidity`,
    commands: `backend/${userId}/commands`,
  };

  sendCommand({ type: "speed", value: speed }, topics);

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

    // Update the speed in the database
    strollerData.speed = speed;
    await strollerData.save();

    // Broadcast the mode change to WebSocket clients
    broadcastWS(userId, {
      type: "speedChange",
      data: {
        speed,
        userId,
        message: "Stroller speed updated successfully",
      },
    });
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

  const userExists = await ecbUserRegistration.findOne({ sysUserId: userId }); // Replace UserModel with your actual user model
  if (!userExists) {
    return res.status(404).send({
      success: false,
      message: "User ID does not exist.",
    });
  }

  const { strollerId } = userExists;

  // MQTT Topics
  const topics = {
    gps: `stroller/${userId}/gps`,
    status: `stroller/${userId}/status`,
    tempHumidity: `stroller/${userId}/temp_humidity`,
    commands: `backend/${userId}/commands`,
  };

  sendCommand(
    {
      type: "resetDistance",
      value: 0,
    },
    topics
  );

  // Broadcast the mode change to WebSocket clients
  broadcastWS(userId, {
    type: "resetDistance",
    data: {
      distance: 0,
      userId,
      message: "Stroller  distance reset successfully",
    },
  });

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

  const userExists = await ecbUserRegistration.findOne({ sysUserId: userId }); // Replace UserModel with your actual user model
  if (!userExists) {
    return res.status(404).send({
      success: false,
      message: "User ID does not exist.",
    });
  }

  const { strollerId } = userExists;

  // MQTT Topics
  const topics = {
    gps: `stroller/${userId}/gps`,
    status: `stroller/${userId}/status`,
    tempHumidity: `stroller/${userId}/temp_humidity`,
    commands: `backend/${userId}/commands`,
  };

  sendCommand({ type: "halt", value: true }, topics);

  // Broadcast the mode change to WebSocket clients
  broadcastWS(userId, {
    type: "haltDistance",
    data: {
      halted: true,
      userId,
      message: "Tracking stroller  distance is halted successfully",
    },
  });

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

  const userExists = await ecbUserRegistration.findOne({ sysUserId: userId }); // Replace UserModel with your actual user model
  if (!userExists) {
    return res.status(404).send({
      success: false,
      message: "User ID does not exist.",
    });
  }

  const { strollerId } = userExists;

  // MQTT Topics
  const topics = {
    gps: `stroller/${userId}/gps`,
    status: `stroller/${userId}/status`,
    tempHumidity: `stroller/${userId}/temp_humidity`,
    commands: `backend/${userId}/commands`,
  };

  sendCommand({ type: "resume", value: true }, topics);

  // Broadcast the mode change to WebSocket clients
  broadcastWS(userId, {
    type: "resumeDistance",
    data: {
      halted: false,
      userId,
      message: "Tracking stroller  distance is resumed successfully",
    },
  });

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

    const userExists = await ecbUserRegistration.findOne({ sysUserId: userId }); // Replace UserModel with your actual user model
    if (!userExists) {
      return res.status(404).send({
        success: false,
        message: "User ID does not exist.",
      });
    }

    const { strollerId } = userExists;

    // MQTT Topics
    const topics = {
      gps: `stroller/${userId}/gps`,
      status: `stroller/${userId}/status`,
      tempHumidity: `stroller/${userId}/temp_humidity`,
      commands: `backend/${userId}/commands`,
    };

    sendCommand(
      { type: "distance", value: strollerData.distance || 0 },
      topics
    );
    // Broadcast the mode change to WebSocket clients
    broadcastWS(userId, {
      type: "getDistance",
      data: {
        distance: strollerData.distance || 0,
        userId,
        message: "Stroller  distance is received successfully",
      },
    });

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

    const userExists = await ecbUserRegistration.findOne({ sysUserId: userId }); // Replace UserModel with your actual user model
    if (!userExists) {
      return res.status(404).send({
        success: false,
        message: "User ID does not exist.",
      });
    }

    const { strollerId } = userExists;

    // MQTT Topics
    const topics = {
      gps: `stroller/${userId}/gps`,
      status: `stroller/${userId}/status`,
      tempHumidity: `stroller/${userId}/temp_humidity`,
      commands: `backend/${userId}/commands`,
    };

    sendCommand({ type: "status", value: strollerData.status || null }, topics);

    // Broadcast the mode change to WebSocket clients
    broadcastWS(userId, {
      type: "getStatus",
      data: {
        status: strollerData.status || null,
        userId,
        message: "Stroller  status is received successfully",
      },
    });

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

  const userExists = await ecbUserRegistration.findOne({ sysUserId: userId }); // Replace UserModel with your actual user model
  if (!userExists) {
    return res.status(404).send({
      success: false,
      message: "User ID does not exist.",
    });
  }

  const { strollerId } = userExists;

  // MQTT Topics
  const topics = {
    gps: `stroller/${userId}/gps`,
    status: `stroller/${userId}/status`,
    tempHumidity: `stroller/${userId}/temp_humidity`,
    commands: `backend/${userId}/commands`,
  };

  sendCommand({ type: "steer", value: steering || null }, topics);

  // Broadcast the mode change to WebSocket clients
  broadcastWS(userId, {
    type: "setSteering",
    data: {
      steering: steering,
      userId,
      message: "Stroller  steering is set successfully",
    },
  });

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
    // await strollerData.save();

    // MQTT Topics
    const topics = {
      gps: `stroller/${userId}/gps`,
      status: `stroller/${userId}/status`,
      tempHumidity: `stroller/${userId}/temp_humidity`,
      commands: `backend/${userId}/commands`,
    };
    // Publish the steering command
    sendCommand({ type: "steer", value: steering }, topics);

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
        message: "Stroller data not found for the provided user ID.",
      });
    }

    // Broadcast the mode change to WebSocket clients
    broadcastWS(userId, {
      type: "getTempHumidity",
      data: {
        temperature: strollerData.temperature,
        humidity: strollerData.humidity,
        userId,
        message:
          "Stroller  temperature and humidity are received successfully.",
      },
    });

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

  const userExists = await ecbUserRegistration.findOne({ sysUserId: userId }); // Replace UserModel with your actual user model
  if (!userExists) {
    return res.status(404).send({
      success: false,
      message: "User ID does not exist.",
    });
  }

  const { strollerId } = userExists;

  // MQTT Topics
  const topics = {
    gps: `stroller/${userId}/gps`,
    status: `stroller/${userId}/status`,
    tempHumidity: `stroller/${userId}/temp_humidity`,
    commands: `backend/${userId}/commands`,
  };

  sendCommand({ type: "remote", value: remote }, topics);

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

    // Broadcast the mode change to WebSocket clients
    broadcastWS(userId, {
      type: "setRemote",
      data: {
        remote: remote,
        userId,
        message: "Stroller remote method set successfully.",
      },
    });

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

  // Broadcast the mode change to WebSocket clients
  broadcastWS(userId, {
    type: "setTempHumidity",
    data: {
      temperature,
      humidity,
      userId,
      message: "Stroller temperature and hunidity set successfully.",
    },
  });

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

export { router as websocketRouter, setupWebSocket, setupMQTT };
