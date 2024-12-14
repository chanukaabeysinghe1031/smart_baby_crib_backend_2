import ecbWeightCurrent from "../models/ecbWeightCurrent.model.js";
import ecbUserRegisteration from "../models/ecbUserRegistration.model.js";

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

    const query = {
      etlDateTime: {
        $gte: start,
        $lte: end,
      },
      sysUserId: userId,
    };

    const data = await ecbWeightCurrent.find(query);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Retrieve a single record by ID
export const findOne = async (req, res) => {
  try {
    const data = await ecbWeightCurrent.findById(req.params.id);
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
  const data = new ecbWeightCurrent(req.body);
  const { sysUserId } = req.body;

  try {
    // Find the user by sysUserId
    const user = await ecbUserRegisteration.findOne({ sysUserId: sysUserId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { userFedBabyAge, createdAt } = user;

    // Calculate the current age
    const lengthCreatedAt = new Date(); // Assuming current date as length record creation

    const monthsSinceRegistration = Math.floor(
      (lengthCreatedAt.getTime() - new Date(createdAt).getTime()) /
        (30.4375 * 24 * 60 * 60 * 1000)
    );
    const currentAge = userFedBabyAge + monthsSinceRegistration;

    // Add currentAge to the record
    data.currentAge = currentAge;
    const newData = await data.save();
    res.status(201).json(newData);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
