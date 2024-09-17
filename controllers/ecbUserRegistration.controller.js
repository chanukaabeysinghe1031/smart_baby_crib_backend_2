import ecbUserRegistration from "../models/ecbUserRegistration.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Sign-in route
export const signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await ecbUserRegistration.findOne({
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
      user: user,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Signout Function for Token-Based Authentication (JWT)
export const signout = (req, res) => {
  try {
    // If using cookies to store the token, clear it
    res.clearCookie("token"); // Assuming the token is stored in a cookie

    // Optionally, add logic here to invalidate the token in the database if stored

    // Return success message
    return res.status(200).json({ message: "Successfully signed out" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
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

// Retrieve a single record by sysUserId
export const findBySysUserId = async (req, res) => {
  try {
    // Find the user by sysUserId
    const data = await ecbUserRegistration.findOne({
      sysUserId: req.params.sysUserId,
    });

    // If the user is not found, return a 404 error
    if (!data) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the user data
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new record with an incremented sysUserId
export const create = async (req, res) => {
  try {
    // Find the largest sysUserId
    const maxUser = await ecbUserRegistration
      .findOne()
      .sort({ sysUserId: -1 })
      .exec();

    // Set the new sysUserId to max + 1, or default to 1 if no users exist
    const newSysUserId = maxUser ? maxUser.sysUserId + 1 : 1;

    // Create a new user with the incremented sysUserId
    const data = new ecbUserRegistration({
      ...req.body,
      sysUserId: newSysUserId,
    });

    // Save the new user
    const newData = await data.save();
    res.status(201).json(newData);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update a record by sysUserId
export const update = async (req, res) => {
  try {
    // Find and update the record by sysUserId
    const updatedData = await ecbUserRegistration.findOneAndUpdate(
      { sysUserId: req.params.id }, // Search by sysUserId
      req.body, // Data to update
      { new: true, runValidators: true } // Options: return the updated record and run validation
    );

    // If no data found, return 404
    if (!updatedData) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the updated data
    res.status(200).json(updatedData);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a record by ID
export const deleteRecord = async (req, res) => {
  try {
    const deletedData = await ecbUserRegistration.findOneAndDelete({
      sysUserId: req.params.id,
    });
    if (!deletedData) {
      return res.status(404).json({ message: "Data not found" });
    }
    res.status(200).json({ message: "Record deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
