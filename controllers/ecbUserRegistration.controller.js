import ecbUserRegistration from "../models/ecbUserRegistration.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Sign-in route
export const signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await ecbUserRegisteration.findOne({
      userFedEmailAddress: email,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.userFedPassword);

    if (!isMatch) {
      return res.status(403).json({ message: "Invalid password" });
    }

    // Create a JWT token valid for 8 hours
    const token = jwt.sign(
      { id: user._id, email: user.userFedEmailAddress },
      "dsfdasfasdfdkllierrm339i&asfjl@fhdaskf#jhafshlkdkfhhaskldhfjdashnlwqjerheqhrekjrhekjqwhrejkqwrejqwj$kjsadkjfas",
      {
        expiresIn: "8h",
      }
    );

    // Set the JWT token as an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true, // Prevent JavaScript access to the cookie
      secure: process.env.NODE_ENV === "production", // Ensure the cookie is sent over HTTPS in production
      maxAge: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
    });

    // Return user details (excluding sensitive information)
    res.json({
      message: "Sign-in successful",
      user: {
        id: user._id,
        firstName: user.userFedFirstName,
        parentFirstName: user.userFedParentFirstName,
        email: user.userFedEmailAddress,
        babyGender: user.userFedBabyGender,
        babyAge: user.userFedBabyAge,
        strollerModelNo: user.userFedStrollerModelNo,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Retrieve all records
export const findAll = async (req, res) => {
  try {
    const data = await ecbUserRegistration.find();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Retrieve a single record by ID
export const findOne = async (req, res) => {
  try {
    const data = await ecbUserRegistration.findById(req.params.id);
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
  const data = new ecbUserRegistration(req.body);
  try {
    const newData = await data.save();
    res.status(201).json(newData);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update a record by ID
export const update = async (req, res) => {
  try {
    const updatedData = await ecbUserRegistration.findByIdAndUpdate(
      req.params.id,
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

// Delete a record by ID
export const deleteRecord = async (req, res) => {
  try {
    const deletedData = await ecbUserRegistration.findByIdAndDelete(
      req.params.id
    );
    if (!deletedData) {
      return res.status(404).json({ message: "Data not found" });
    }
    res.status(200).json({ message: "Record deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
