/**
 * @swagger
 * tags:
 *   name: EcbGpsTrackCurrent
 *   description: API to manage EcbGpsTrackCurrent records
 */

/**
 * @swagger
 * /api/gps/current:
 *   get:
 *     summary: Retrieve all EcbGpsTrackCurrent records
 *     tags: [EcbGpsTrackCurrent]
 *     responses:
 *       200:
 *         description: A list of EcbGpsTrackCurrent records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EcbGpsTrackCurrent'
 *       403:
 *         description: Authentication failed.
 */

/**
 * @swagger
 * /api/gps/current/{id}:
 *   get:
 *     summary: Retrieve a single EcbGpsTrackCurrent record by ID
 *     tags: [EcbGpsTrackCurrent]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The record ID
 *     responses:
 *       200:
 *         description: A single EcbGpsTrackCurrent record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EcbGpsTrackCurrent'
 *       403:
 *         description: Authentication failed.
 *       404:
 *         description: Record not found
 */

/**
 * @swagger
 * /api/gps/current:
 *   post:
 *     summary: Create a new EcbGpsTrackCurrent record
 *     tags: [EcbGpsTrackCurrent]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EcbGpsTrackCurrent'
 *     responses:
 *       201:
 *         description: The created record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EcbGpsTrackCurrent'
 *       403:
 *         description: Authentication failed.
 */

/**
 * @swagger
 * /api/gps/current/{id}:
 *   put:
 *     summary: Update a EcbGpsTrackCurrent record by ID
 *     tags: [EcbGpsTrackCurrent]
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
 *             $ref: '#/components/schemas/EcbGpsTrackCurrent'
 *     responses:
 *       200:
 *         description: The updated record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EcbGpsTrackCurrent'
 *       403:
 *         description: Authentication failed.
 *       404:
 *         description: Record not found
 */

/**
 * @swagger
 * /api/gps/current/{id}:
 *   delete:
 *     summary: Delete a EcbGpsTrackCurrent record by ID
 *     tags: [EcbGpsTrackCurrent]
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
 *     EcbGpsTrackCurrent:
 *       type: object
 *       required:
 *         - sysUserId
 *         - gpsData
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the record
 *         sysUserId:
 *           type: number
 *           description: The user ID
 *         gpsData:
 *           type: string
 *           description: The GPS data
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
 *         gpsData: "sample_gps_data"
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
} from "../controllers/ecbGpsTrackCurrent.controller.js";
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
