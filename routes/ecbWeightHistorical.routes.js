/**
 * @swagger
 * tags:
 *   name: EcbWeightHistorical
 *   description: API to manage EcbWeightHistorical records
 */

/**
 * @swagger
 * /api/weight/historical:
 *   get:
 *     summary: Retrieve all EcbWeightHistorical records
 *     tags: [EcbWeightHistorical]
 *     responses:
 *       200:
 *         description: A list of EcbWeightHistorical records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EcbWeightHistorical'
 *       403:
 *         description: Authentication failed.
 */

/**
 * @swagger
 * /api/weight/historical/{id}:
 *   get:
 *     summary: Retrieve a single EcbWeightHistorical record by ID
 *     tags: [EcbWeightHistorical]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The record ID
 *     responses:
 *       200:
 *         description: A single EcbWeightHistorical record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EcbWeightHistorical'
 *       403:
 *         description: Authentication failed.
 *       404:
 *         description: Record not found
 */

/**
 * @swagger
 * /api/weight/historical:
 *   post:
 *     summary: Create a new EcbWeightHistorical record
 *     tags: [EcbWeightHistorical]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EcbWeightHistorical'
 *     responses:
 *       201:
 *         description: The created record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EcbWeightHistorical'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Authentication failed.
 */

/**
 * @swagger
 * /api/weight/historical/{id}:
 *   put:
 *     summary: Update a EcbWeightHistorical record by ID
 *     tags: [EcbWeightHistorical]
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
 *             $ref: '#/components/schemas/EcbWeightHistorical'
 *     responses:
 *       200:
 *         description: The updated record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EcbWeightHistorical'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Authentication failed.
 *       404:
 *         description: Record not found
 */

/**
 * @swagger
 * /api/weight/historical/{id}:
 *   delete:
 *     summary: Delete a EcbWeightHistorical record by ID
 *     tags: [EcbWeightHistorical]
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
 *       404:
 *         description: Record not found
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     EcbWeightHistorical:
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

import { Router } from "express";
import {
  create,
  findAll,
  findOne,
  update,
  deleteRecord,
} from "../controllers/ecbWeightHistorical.controller.js";
import jwtAuth from "../jwtAuth.js"; // Import the JWT middleware

const router = Router();

router.post("/", jwtAuth, create);
router.post("/withoutJWT", create);

router.get("/", jwtAuth, findAll);
router.get("/withoutJWT", findAll);

router.get("/:id", jwtAuth, findOne);

router.put("/", jwtAuth, update);
router.put("/withoutJWT/", update);

router.delete("/", jwtAuth, deleteRecord);
router.delete("/withoutJWT/", deleteRecord);

export default router;
