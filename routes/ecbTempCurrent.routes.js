/**
 * @swagger
 * tags:
 *   name: EcbTempCurrent
 *   description: API to manage EcbTempCurrent records
 */

/**
 * @swagger
 * /api/temp/current:
 *   get:
 *     summary: Retrieve all EcbTempCurrent records
 *     tags: [EcbTempCurrent]
 *     responses:
 *       200:
 *         description: A list of EcbTempCurrent records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EcbTempCurrent'
 *       403:
 *         description: Authentication failed.
 */

/**
 * @swagger
 * /api/temp/current/{id}:
 *   get:
 *     summary: Retrieve a single EcbTempCurrent record by ID
 *     tags: [EcbTempCurrent]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The record ID
 *     responses:
 *       200:
 *         description: A single EcbTempCurrent record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EcbTempCurrent'
 *       403:
 *         description: Authentication failed.
 *       404:
 *         description: Record not found
 */

/**
 * @swagger
 * /api/temp/current:
 *   post:
 *     summary: Create a new EcbTempCurrent record
 *     tags: [EcbTempCurrent]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EcbTempCurrent'
 *     responses:
 *       201:
 *         description: The created record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EcbTempCurrent'
 *       403:
 *         description: Authentication failed.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     EcbTempCurrent:
 *       type: object
 *       required:
 *         - sysUserId
 *         - tempData
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the record
 *         sysUserId:
 *           type: number
 *           description: The user ID
 *         tempData:
 *           type: string
 *           description: The temperature data
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
 *         tempData: "sample_temp_data"
 *         createdAt: 2023-10-01T12:34:56.789Z
 *         updatedAt: 2023-10-01T12:34:56.789Z
 */

import express from "express";
import {
  create,
  findAllByUser,
  findOne,
} from "../controllers/ecbTempCurrent.controller.js";
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
