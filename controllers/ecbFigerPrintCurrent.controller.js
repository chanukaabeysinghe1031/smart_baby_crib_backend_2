import ecbFingerPrintCurrent from "../models/ecbFingerPrintCurrent.model.js";

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

    const data = await ecbFingerPrintCurrent.find(query);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Retrieve a single record by ID
export const findOne = async (req, res) => {
  try {
    const data = await ecbFingerPrintCurrent.findOne({
      sysUserId: req.params.id,
    });
    if (!data) {
      return res.status(404).json({ message: "Data not found" });
    }
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new record
export const create = async (req, res) => {
  const data = new ecbFingerPrintCurrent(req.body);
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
    const updatedData = await ecbFingerPrintCurrent.findOneAndUpdate(
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
    const deletedData = await ecbFingerPrintCurrent.findOneAndDelete({
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
