/**
 * @swagger
 * tags:
 *   name: EcbLengthHistorical
 *   description: API to manage EcbLengthHistorical records
 */

/**
 * @swagger
 * /api/length/historical:
 *   get:
 *     summary: Retrieve all EcbLengthHistorical records
 *     tags: [EcbLengthHistorical]
 *     responses:
 *       200:
 *         description: A list of EcbLengthHistorical records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EcbLengthHistorical'
 *       403:
 *         description: Authentication failed.
 */

/**
 * @swagger
 * /api/length/historical/{id}:
 *   get:
 *     summary: Retrieve a single EcbLengthHistorical record by ID
 *     tags: [EcbLengthHistorical]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The record ID
 *     responses:
 *       200:
 *         description: A single EcbLengthHistorical record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EcbLengthHistorical'
 *       403:
 *         description: Authentication failed.
 *       404:
 *         description: Record not found
 */

/**
 * @swagger
 * /api/length/historical:
 *   post:
 *     summary: Create a new EcbLengthHistorical record
 *     tags: [EcbLengthHistorical]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EcbLengthHistorical'
 *     responses:
 *       201:
 *         description: The created record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EcbLengthHistorical'
 *       403:
 *         description: Authentication failed.
 */

/**
 * @swagger
 * /api/length/historical/{id}:
 *   put:
 *     summary: Update a EcbLengthHistorical record by ID
 *     tags: [EcbLengthHistorical]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EcbLengthHistorical'
 *     responses:
 *       200:
 *         description: The updated record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EcbLengthHistorical'
 *       403:
 *         description: Authentication failed.
 *       404:
 *         description: Record not found
 */

/**
 * @swagger
 * /api/length/historical/{id}:
 *   delete:
 *     summary: Delete a EcbLengthHistorical record by ID
 *     tags: [EcbLengthHistorical]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The record ID
 *     responses:
 *       200:
 *         description: Record deleted successfully
 *       403:
 *         description: Authentication failed.
 *       404:
 *         description: Record not found
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     EcbLengthHistorical:
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
  findAll,
  findOne,
  update,
  deleteRecord,
} from "../controllers/ecbLengthHistorical.controller.js";
import jwtAuth from "../jwtAuth.js"; // Import the JWT middleware

const router = express.Router();

// Retrieve all records
router.get("/", jwtAuth, findAll);

// Retrieve a single record by ID
router.get("/:id", jwtAuth, findOne);

// Create a new record
router.post("/", jwtAuth, create);
router.post("/withoutJWT", create);

// Update a record by ID
router.put("/", jwtAuth, update);
router.put("/withoutJWT/", update);

// Delete a record by ID
router.delete("/", jwtAuth, deleteRecord);
router.delete("/withoutJWT/", deleteRecord);

export default router;
