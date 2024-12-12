import ecbLengthCurrent from "../models/ecbLengthCurrent.model.js";
import ecbUserRegisteration from "../models/ecbUserRegistration.model.js";

// Retrieve all records
export const findAllByUser = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = Number(req.params.id);
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);

    // Fetch the user details to get `userFedBabyAge` and `createdAt`
    const user = await ecbUserRegisteration.findOne({ sysUserId: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { userFedBabyAge, createdAt } = user;

    console.log(userFedBabyAge);

    const query = {
      etlDateTime: {
        $gte: start,
        $lte: end,
      },
      sysUserId: userId,
    };

    const data = await ecbLengthCurrent.find(query);

    // Calculate the current age for each record
    const dataWithCurrentAge = data.map((record) => {
      const lengthCreatedAt = new Date(record.createdAt);
      console.log(
        "CURRENT : " +
          (Date.now() - createdAt.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      const currentAge =
        userFedBabyAge +
        Math.floor(
          (new Date(lengthCreatedAt).getTime() -
            new Date(createdAt).getTime()) /
            (30.4375 * 24 * 60 * 60 * 1000)
        ); // Add years since registration
      return { ...record._doc, currentAge }; // Include the current age in the response
    });

    res.status(200).json(dataWithCurrentAge);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Retrieve a single record by ID
export const findOne = async (req, res) => {
  try {
    const data = await ecbLengthCurrent.findById(req.params.id);
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
  const data = new ecbLengthCurrent(req.body);
  try {
    const newData = await data.save();
    res.status(201).json(newData);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
