/**
 * @swagger
 * tags:
 *   name: EcbWeightCurrent
 *   description: API to manage EcbWeightCurrent records
 */

/**
 * @swagger
 * /api/weight/current:
 *   get:
 *     summary: Retrieve all EcbWeightCurrent records
 *     tags: [EcbWeightCurrent]
 *     responses:
 *       200:
 *         description: A list of EcbWeightCurrent records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EcbWeightCurrent'
 *       403:
 *         description: Authentication failed.
 */

/**
 * @swagger
 * /api/weight/current/{id}:
 *   get:
 *     summary: Retrieve a single EcbWeightCurrent record by ID
 *     tags: [EcbWeightCurrent]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The record ID
 *     responses:
 *       200:
 *         description: A single EcbWeightCurrent record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EcbWeightCurrent'
 *       403:
 *         description: Authentication failed.
 *       404:
 *         description: Record not found
 */

/**
 * @swagger
 * /api/weight/current:
 *   post:
 *     summary: Create a new EcbWeightCurrent record
 *     tags: [EcbWeightCurrent]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EcbWeightCurrent'
 *     responses:
 *       201:
 *         description: The created record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EcbWeightCurrent'
 *       403:
 *         description: Authentication failed.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     EcbWeightCurrent:
 *       type: object
 *       required:
 *         - sysUserId
 *         - weightData
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the record
 *         sysUserId:
 *           type: number
 *           description: The user ID
 *         weightData:
 *           type: string
 *           description: The weight data
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
 *         weightData: "sample_weight_data"
 *         createdAt: 2023-10-01T12:34:56.789Z
 *         updatedAt: 2023-10-01T12:34:56.789Z
 */

import express from "express";
import {
  create,
  findAllByUser,
  findOne,
} from "../controllers/ecbWeightCurrent.controller.js";
import jwtAuth from "../jwtAuth.js"; // Import the JWT middleware

const router = express.Router();

// Define routes
router.get("/user/:id", jwtAuth, findAllByUser);
router.get("/user/withoutJWT/:id", findAllByUser);

router.get("/:id", jwtAuth, findOne);
router.get("/withoutJWT/:id", findOne);

router.post("/", jwtAuth, create);
router.post("/withoutJWT/", create);

export default router;
