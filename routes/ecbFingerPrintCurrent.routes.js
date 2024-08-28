/**
 * @swagger
 * tags:
 *   name: EcbFingerPrintCurrent
 *   description: API to manage EcbFingerPrintCurrent records
 */

/**
 * @swagger
 * /api/fingerprint/current:
 *   get:
 *     summary: Retrieve all EcbFingerPrintCurrent records
 *     tags: [EcbFingerPrintCurrent]
 *     responses:
 *       200:
 *         description: A list of EcbFingerPrintCurrent records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EcbFingerPrintCurrent'
 *       403:
 *         description: Authentication failed.
 */

/**
 * @swagger
 * /api/fingerprint/current/{id}:
 *   get:
 *     summary: Retrieve a single EcbFingerPrintCurrent record by ID
 *     tags: [EcbFingerPrintCurrent]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The record ID
 *     responses:
 *       200:
 *         description: A single EcbFingerPrintCurrent record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EcbFingerPrintCurrent'
 *       403:
 *         description: Authentication failed.
 *       404:
 *         description: Record not found
 */

/**
 * @swagger
 * /api/fingerprint/current:
 *   post:
 *     summary: Create a new EcbFingerPrintCurrent record
 *     tags: [EcbFingerPrintCurrent]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EcbFingerPrintCurrent'
 *     responses:
 *       201:
 *         description: The created record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EcbFingerPrintCurrent'
 *       403:
 *         description: Authentication failed.
 */

/**
 * @swagger
 * /api/fingerprint/current/{id}:
 *   put:
 *     summary: Update a EcbFingerPrintCurrent record by ID
 *     tags: [EcbFingerPrintCurrent]
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
 *             $ref: '#/components/schemas/EcbFingerPrintCurrent'
 *     responses:
 *       200:
 *         description: The updated record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EcbFingerPrintCurrent'
 *       403:
 *         description: Authentication failed.
 *       404:
 *         description: Record not found
 */

/**
 * @swagger
 * /api/fingerprint/current/{id}:
 *   delete:
 *     summary: Delete a EcbFingerPrintCurrent record by ID
 *     tags: [EcbFingerPrintCurrent]
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
 *     EcbFingerPrintCurrent:
 *       type: object
 *       required:
 *         - sysUserId
 *         - fingerPrintData
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the record
 *         sysUserId:
 *           type: number
 *           description: The user ID
 *         fingerPrintData:
 *           type: string
 *           description: The fingerprint data
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
 *         fingerPrintData: "sample_fingerprint_data"
 *         createdAt: 2023-10-01T12:34:56.789Z
 *         updatedAt: 2023-10-01T12:34:56.789Z
 */

import express from "express";
import {
  create,
  findAllByUser,
  findOne,
  update,
  deleteRecord,
} from "../controllers/ecbFigerPrintCurrent.controller.js";
import jwtAuth from "../jwtAuth.js"; // Import the JWT middleware

const router = express.Router();

// Retrieve all records by user id
router.get("/user/:id", jwtAuth, findAllByUser);
router.get("/user/withoutJWT/:id", findAllByUser);

// Retrieve a single record by ID
router.get("/:id", jwtAuth, findOne);
router.get("/withoutJWT/:id", findOne);

// Create a new record
router.post("/", jwtAuth, create);
router.post("/withoutJWT", create);

// Update a record by ID
router.put("/:id", jwtAuth, update);
router.put("/withoutJWT/:id", update);

// Delete a record by ID
router.delete("/:id", jwtAuth, deleteRecord);
router.delete("/withoutJWT/:id", deleteRecord);

export default router;
