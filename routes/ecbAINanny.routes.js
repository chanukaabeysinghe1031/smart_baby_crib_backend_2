/**
 * @swagger
 * tags:
 *   name: AskMeAnything
 *   description: API to manage Ask Me Anything records
 */

/**
 * @swagger
 * /api/askme:
 *   get:
 *     summary: Retrieve all Ask Me Anything records
 *     tags: [AskMeAnything]
 *     responses:
 *       200:
 *         description: A list of Ask Me Anything records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AskMeAnything'
 *       403:
 *         description: Authentication failed.
 */

/**
 * @swagger
 * /api/askme/{id}:
 *   get:
 *     summary: Retrieve a single Ask Me Anything record by ID
 *     tags: [AskMeAnything]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The record ID
 *     responses:
 *       200:
 *         description: A single Ask Me Anything record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AskMeAnything'
 *       403:
 *         description: Authentication failed.
 *       404:
 *         description: Record not found
 */

/**
 * @swagger
 * /api/askme:
 *   post:
 *     summary: Create a new Ask Me Anything record
 *     tags: [AskMeAnything]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AskMeAnything'
 *     responses:
 *       201:
 *         description: The created record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AskMeAnything'
 *       403:
 *         description: Authentication failed.
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/askme/{id}:
 *   put:
 *     summary: Update an Ask Me Anything record by ID
 *     tags: [AskMeAnything]
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
 *             $ref: '#/components/schemas/AskMeAnything'
 *     responses:
 *       200:
 *         description: The updated record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AskMeAnything'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Authentication failed.
 *       404:
 *         description: Record not found
 */

/**
 * @swagger
 * /api/askme/{id}:
 *   delete:
 *     summary: Delete an Ask Me Anything record by ID
 *     tags: [AskMeAnything]
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
 *     AskMeAnything:
 *       type: object
 *       required:
 *         - sysUserId
 *         - userFedQuestion
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the record
 *         sysUserId:
 *           type: number
 *           description: The user ID
 *         userFedQuestion:
 *           type: string
 *           description: The question asked by the user
 *         etlDateTime:
 *           type: string
 *           format: date-time
 *           description: The date and time the record was created
 *         etlSerialNo:
 *           type: number
 *           description: The serial number of the record
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the record was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the record was last updated
 *       example:
 *         sysUserId: 887342
 *         userFedQuestion: A very complex question.
 *         etlDateTime: 2023-10-01T12:34:56.789Z
 *         etlSerialNo: 1
 *         createdAt: 2023-10-01T12:34:56.789Z
 *         updatedAt: 2023-10-01T12:34:56.789Z
 */

import express from "express";
import {
  create,
  findAllByUser,
  update,
  deleteRecord,
  addNewQuestion,
} from "../controllers/ecbAINanny.controller.js";
import jwtAuth from "../jwtAuth.js"; // Import the JWT middleware

const router = express.Router();

// Retrieve all records by user id and date range
router.get("/user/:id", jwtAuth, findAllByUser);
router.get("/user/withoutJWT/:id", findAllByUser);

// Create a new record
router.post("/", jwtAuth, create);
router.post("/withoutJWT", create);

// Create a new record
router.post("/generateSolution", jwtAuth, addNewQuestion);
router.post("/generateSolution/withoutJWT", addNewQuestion);

// Update a record by ID
router.put("/:id", jwtAuth, update);
router.put("/withoutJWT/:id", update);

// Delete a record by ID
router.delete("/:id", jwtAuth, deleteRecord);
router.delete("/withoutJWT/:id", deleteRecord);

export default router;
