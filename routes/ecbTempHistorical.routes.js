/**
 * @swagger
 * tags:
 *   name: EcbTempHistorical
 *   description: Ecb Temperature Historical Records management
 */

/**
 * @swagger
 * /api/temp/historical:
 *   get:
 *     summary: Retrieve all records
 *     tags: [EcbTempHistorical]
 *     responses:
 *       200:
 *         description: A list of records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Record'
 *       403:
 *         description: Authentication failed.
 */

/**
 * @swagger
 * /api/temp/historical/{id}:
 *   get:
 *     summary: Retrieve a single record by ID
 *     tags: [EcbTempHistorical]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The record ID
 *     responses:
 *       200:
 *         description: A single record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Record'
 *       403:
 *         description: Authentication failed.
 *       404:
 *         description: Record not found
 */

/**
 * @swagger
 * /api/temp/historical/:
 *   post:
 *     summary: Create a new record
 *     tags: [EcbTempHistorical]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Record'
 *     responses:
 *       201:
 *         description: The created record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Record'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Authentication failed.
 */

/**
 * @swagger
 * /api/temp/historical/{id}:
 *   put:
 *     summary: Update a record by ID
 *     tags: [EcbTempHistorical]
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
 *             $ref: '#/components/schemas/Record'
 *     responses:
 *       200:
 *         description: The updated record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Record'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Authentication failed.
 *       404:
 *         description: Record not found
 */

/**
 * @swagger
 * /api/temp/historical/{id}:
 *   delete:
 *     summary: Delete a record by ID
 *     tags: [EcbTempHistorical]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The record ID
 *     responses:
 *       200:
 *         description: The deleted record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Record'
 *       403:
 *         description: Authentication failed.
 *       404:
 *         description: Record not found
 */

import express from "express";
import {
  create,
  findAll,
  findOne,
  update,
  deleteRecord,
} from "../controllers/ecbTempHistorical.controller.js";
import jwtAuth from "../jwtAuth.js"; // Import the JWT middleware

const router = express.Router();

// Retrieve all records
router.get("/", jwtAuth, findAll);

// Retrieve a single record by ID
router.get("/:id", jwtAuth, findOne);

// Create a new record
router.post("/", jwtAuth, create);
router.post("/withoutJWT/", create);

// Update a record by ID
router.put("/", jwtAuth, update);
router.put("/withoutJWT/", update);

// Delete a record by ID
router.delete("/", jwtAuth, deleteRecord);
router.delete("/withoutJWT/", deleteRecord);

export default router;
