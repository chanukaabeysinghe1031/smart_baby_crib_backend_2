import ecbUserRegistration from "../models/ecbUserRegistration.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import qrcode from "qrcode";
import nodemailer from "nodemailer";
import { CourierClient } from "@trycourier/courier";
import crypto from "crypto";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const COUREIER_TOKEN = process.env.COURIER_PROD_TOKEN;

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
      JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    // Generate QR code with the token
    const qrCode = await qrcode.toDataURL(token);

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
      token: token,
      qrCode: qrCode,
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

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user exists
    const user = await ecbUserRegistration.findOne({
      userFedEmailAddress: email,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a 6-digit verification code
    const verificationCode = crypto.randomInt(100000, 999999);
    const codeExpiration = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes

    // Save the code and expiration in the user's document
    user.passwordResetCode = verificationCode;
    user.passwordResetExpires = codeExpiration;
    await user.save();

    // Initialize Courier client
    const courier = new CourierClient({
      authorizationToken: COUREIER_TOKEN,
    });

    // Send email using Courier
    const emailResponse = await courier.send({
      message: {
        to: {
          email: user.userFedEmailAddress,
        },
        content: {
          title: "Password Reset Code",
          body: `
            Hi ${user.name || "User"},
            
            We received a request to reset your password. Use the code below to reset your password. This code is valid for 15 minutes.

            **Code**: ${verificationCode}

            If you did not request this, please ignore this email.

            Best regards,  
            The Smart Baby Crib Team
          `,
        },
      },
    });

    console.log("Courier Email Response:", emailResponse);

    // Return success response
    res.status(200).json({
      message: "Verification code sent successfully via email",
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message || error });
  }
};

export const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    // Find the user by email
    const user = await ecbUserRegistration.findOne({
      userFedEmailAddress: email,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the code is correct and not expired
    if (
      user.passwordResetCode !== parseInt(code, 10) ||
      new Date() > user.passwordResetExpires
    ) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    // Update the user's password and clear the reset fields
    user.userFedPassword = newPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message || error });
  }
};

export const contactSupport = async (req, res) => {
  const { email, contactNumber, message } = req.body;

  try {
    // Validate input
    if (!email || !contactNumber || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Initialize Courier client
    const courier = new CourierClient({
      authorizationToken: COUREIER_TOKEN,
    });

    // Send email using Courier
    const emailResponse = await courier.send({
      message: {
        to: {
          email: "chawwa31@gmail.com", // Replace with your support email
        },
        content: {
          title: "Support Request",
          body: `
            A user has submitted a support request:

            **User Details**:
            - Email: ${email}
            - Contact Number: ${contactNumber}

            **Message**:
            ${message}

            Please respond to the user promptly.
          `,
        },
      },
    });

    console.log("Courier Email Response:", emailResponse);

    // Return success response
    res.status(200).json({
      message: "Support request sent successfully",
    });
  } catch (error) {
    console.error("Error in contactSupport:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message || error });
  }
};
