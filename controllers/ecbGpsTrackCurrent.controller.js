import ecbGpsTrackCurrent from "../models/ecbGpsTrackCurrent.model.js";
import axios from "axios";

// Retrieve all records
export const findAllByUser = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = Number(req.params.id);
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);

    const query = {
      etlDateTime: {
        $gte: start,
        $lte: end,
      },
      sysUserId: userId,
    };

    const data = await ecbGpsTrackCurrent.find(query);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Retrieve a single record by ID
export const findOne = async (req, res) => {
  try {
    const data = await ecbGpsTrackCurrent.findOne({ sysUserId: req.params.id });
    if (!data) {
      return res.status(404).json({ message: "Data not found" });
    }
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Function to calculate distance between two GPS coordinates in meters
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius of Earth in meters
  const φ1 = (lat1 * Math.PI) / 180; // Convert to radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Create a new record
export const create = async (req, res) => {
  const data = new ecbGpsTrackCurrent(req.body);
  try {
    const newData = await data.save();
    res.status(201).json(newData);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update a record by user id
export const update = async (req, res) => {
  try {
    const { sysUserId, etlSequenceNo } = req.body;
    const updatedData = await ecbGpsTrackCurrent.findOneAndUpdate(
      { sysUserId: sysUserId, etlSequenceNo: etlSequenceNo },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedData) {
      return res.status(404).json({ message: "Data not found" });
    }

    res.status(200).json(updatedData);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a record by sysUserId and etlSequenceNo
export const deleteRecord = async (req, res) => {
  try {
    const { sysUserId, etlSequenceNo } = req.body;
    const deletedData = await ecbGpsTrackCurrent.findOneAndDelete({
      sysUserId: sysUserId,
      etlSequenceNo: etlSequenceNo,
    });
    if (!deletedData) {
      return res.status(404).json({ message: "Data not found" });
    }
    res.status(200).json({ message: "Record deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// API KEY AIzaSyCpNPNgWfjvIzWUJXmNbTLubOq_lT7L5f4
export const getAirQualityWithLatestGps = async (req, res) => {
  try {
    const { sysUserId } = req.params;

    // Fetch the latest GPS location
    const latestRecord = await ecbGpsTrackCurrent
      .findOne({ sysUserId })
      .sort({ etlSequenceNo: -1 })
      .select("sysGpsLongitude sysGpsLatitude");

    if (!latestRecord) {
      return res.status(404).json({ message: "No GPS location found" });
    }

    const latitude = parseFloat(latestRecord.sysGpsLatitude);
    const longitude = parseFloat(latestRecord.sysGpsLongitude);

    console.log("LAT " + latitude);
    console.log("LONG " + longitude);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ message: "Invalid GPS coordinates" });
    }

    // AIzaSyChUl-o5NE8EHrO1r6PgPmPadRlBMCFArw
    const API_KEY = "AIzaSyChUl-o5NE8EHrO1r6PgPmPadRlBMCFArw"; // Replace with your actual API key
    const url =
      "https://airquality.googleapis.com/v1/currentConditions:lookup?key=" +
      API_KEY;
    const requestBody = {
      location: {
        latitude: latitude,
        longitude: longitude,
      },
    };

    const airQualityResponse = await axios.post(url, requestBody, {
      headers: { "Content-Type": "application/json" },
    });

    res.status(200).json({
      gps: { latitude, longitude },
      airQuality: airQualityResponse.data,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};
