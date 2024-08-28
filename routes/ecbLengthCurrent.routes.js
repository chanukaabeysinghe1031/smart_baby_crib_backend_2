/**
 * @swagger
 * tags:
 *   name: EcbLengthCurrent
 *   description: API to manage EcbLengthCurrent records
 */

/**
 * @swagger
 * /api/length/current:
 *   get:
 *     summary: Retrieve all EcbLengthCurrent records
 *     tags: [EcbLengthCurrent]
 *     responses:
 *       200:
 *         description: A list of EcbLengthCurrent records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EcbLengthCurrent'
 *       403:
 *         description: Authentication failed.
 */

/**
 * @swagger
 * /api/length/current/{id}:
 *   get:
 *     summary: Retrieve a single EcbLengthCurrent record by ID
 *     tags: [EcbLengthCurrent]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The record ID
 *     responses:
 *       200:
 *         description: A single EcbLengthCurrent record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EcbLengthCurrent'
 *       403:
 *         description: Authentication failed.
 *       404:
 *         description: Record not found
 */

/**
 * @swagger
 * /api/length/current:
 *   post:
 *     summary: Create a new EcbLengthCurrent record
 *     tags: [EcbLengthCurrent]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EcbLengthCurrent'
 *     responses:
 *       201:
 *         description: The created record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EcbLengthCurrent'
 *       403:
 *         description: Authentication failed.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     EcbLengthCurrent:
 *       type: object
 *       required:
 *         - sysUserId
 *         - lengthData
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the record
 *         sysUserId:
 *           type: number
 *           description: The user ID
 *         lengthData:
 *           type: string
 *           description: The length data
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the record was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the record was last updated
 *       example:
 *         sysUserId: 123456
 *         lengthData: "sample_length_data"
 *         createdAt: 2023-10-01T12:34:56.789Z
 *         updatedAt: 2023-10-01T12:34:56.789Z
 */

import express from "express";
import {
  create,
  findAllByUser,
  findOne,
} from "../controllers/ecbLengthCurrent.controller.js";
import jwtAuth from "../jwtAuth.js"; // Import the JWT middleware

const router = express.Router();

// Retrieve all records
router.get("/user/:id", jwtAuth, findAllByUser);

// Retrieve a single record by ID
router.get("/:id", jwtAuth, findOne);

// Create a new record
router.post("/", jwtAuth, create);
router.post("/withoutJWT/", create);

export default router;
