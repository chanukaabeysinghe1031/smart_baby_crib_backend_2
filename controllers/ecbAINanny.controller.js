import axios from "axios";
import ecbFingerPrintCurrent from "../models/ecbFingerPrintCurrent.model.js";
import ecbGpsTrackCurrent from "../models/ecbGpsTrackCurrent.model.js";
import ecbDeviceRegistration from "../models/ecbDeviceRegistration.model.js";
import ecbLengthCurrent from "../models/ecbLengthCurrent.model.js";
import ecbLengthHistorical from "../models/ecbLengthHistorical.model.js";
import ecbAINanny from "../models/ecbAINanny.model.js";
import ecbWeightCurrent from "../models/ecbWeightCurrent.model.js";
import ecbTempCurrent from "../models/ecbTempCurrent.model.js";
import ecbUserRegistration from "../models/ecbUserRegistration.model.js";

// Retrieve all records
export const findAllByUser = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.params.id;
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

    const data = await ecbAINanny.find(query);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new record
export const create = async (req, res) => {
  const data = new ecbAINanny(req.body);
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
    const updatedData = await ecbAINanny.findOneAndUpdate(
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
    const deletedData = await ecbAINanny.findOneAndDelete({
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

// Function to generate the thread ID
const generateThreadId = async (sysUserId) => {
  // Find the count of existing questions for this user
  const threadCount = await ecbAINanny.countDocuments({ sysUserId });
  // Generate the thread ID
  return `${sysUserId}_${threadCount + 1}`;
};

export const addNewQuestion = async (req, res) => {
  const { question, threadId } = req.body;
  let sysUserId = req.body.sysUserId;

  // Validate input
  if (!sysUserId || !question || !threadId) {
    return res
      .status(400)
      .json({ message: "sysUserId, threadId, and question are required" });
  }

  try {
    // Check if there are existing questions with the same sysUserId and threadId
    const existingThread = await ecbAINanny.findOne({ sysUserId, threadId });

    // Prepare the request data
    let requestData;

    if (!existingThread) {
      // If no existing questions with the same threadId, retrieve the latest data and send all fields
      const weightData = await ecbWeightCurrent
        .findOne({ sysUserId })
        .sort({ etlSequenceNo: -1 })
        .select("sysArduinoWeight") // Projection to include only sysArduinoWeight
        .lean();
      const tempData = await ecbTempCurrent
        .findOne({ sysUserId })
        .sort({ etlSequenceNo: -1 })
        .select("sysArduinoTemperature")
        .lean();
      const lengthData = await ecbLengthCurrent
        .findOne({ sysUserId })
        .sort({ etlSequenceNo: -1 })
        .select("sysArduinoLength")
        .lean();
      const gpsDataLong = await ecbGpsTrackCurrent
        .findOne({ sysUserId })
        .sort({ etlSequenceNo: -1 })
        .select("sysGpsLongitude")
        .lean();
      const gpsDataLat = await ecbGpsTrackCurrent
        .findOne({ sysUserId })
        .sort({ etlSequenceNo: -1 })
        .select("sysGpsLatitude")
        .lean();
      const registeredUser = await ecbUserRegistration.findOne({ sysUserId });
      console.log(registeredUser);
      const registeredDevice = await ecbDeviceRegistration
        .findOne({ sysUserId })
        .sort({ etlSequenceNo: -1 })
        .lean();

      console.log(weightData);
      let sysUserIdWithThread = sysUserId + "_" + threadId;
      requestData = {
        sysUserId: sysUserIdWithThread,
        question,
        threadId, // Include threadId in the request
        weight: weightData.sysArduinoWeight,
        height: lengthData.sysArduinoLength,
        longitude: gpsDataLong.sysGpsLongitude,
        latitude: gpsDataLat.sysGpsLatitude,
        childName: registeredUser.userFedFirstName,
        age: registeredUser.userFedBabyAge,
        sex: registeredUser.userFedBabyGender,
        parentFirstName: registeredDevice.userFedParentFirstName,
        temperature: tempData.sysArduinoTemperature, // Assuming age is stored in tempData, adjust as necessary
      };
    } else {
      // If thread already exists, only send sysUserId, threadId, and question
      let sysUserIdWithThread = sysUserId + "_" + threadId;
      requestData = {
        sysUserId: sysUserIdWithThread,
        question,
        threadId, // Include threadId in the request
      };
    }

    // Make a request to the external API
    const response = await axios.post(
      "https://smartai2-bsaeb9efecftfebf.eastus-01.azurewebsites.net/ask",
      requestData
    );

    // Extract the response data
    const sysResponse = response.data.reply;
    // Create a new record in MongoDB
    const newRecord = new ecbAINanny({
      sysUserId: sysUserId,
      threadId: threadId, // Save the thread ID with the record
      userFedQuestion: question,
      sysResponse: sysResponse,
      threadId: threadId,
    });

    // const savedRecord = await newRecord.save();

    // Return the saved record
    res.status(201).json(newRecord);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
