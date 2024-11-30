import express from "express";
import {
  findAllNotesByUser,
  createNote,
  updateNote,
  deleteNote,
  addNewNote,
} from "../controllers/ecbAINotes.controller.js";
import jwtAuth from "../jwtAuth.js"; // JWT Authentication Middleware

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notes
 *   description: API to manage user notes
 */

/**
 * @swagger
 * /api/notes/user/{id}:
 *   get:
 *     summary: Retrieve all notes for a user within a date range
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: number
 *         required: true
 *         description: The user ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: The start date for filtering notes
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: The end date for filtering notes
 *     responses:
 *       200:
 *         description: A list of notes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Note'
 *       403:
 *         description: Authentication failed
 */

/**
 * @swagger
 * /api/notes:
 *   post:
 *     summary: Create a new note
 *     tags: [Notes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Note'
 *     responses:
 *       201:
 *         description: The created note
 *       400:
 *         description: Bad request
 *       403:
 *         description: Authentication failed
 */

/**
 * @swagger
 * /api/notes:
 *   put:
 *     summary: Update an existing note
 *     tags: [Notes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Note'
 *     responses:
 *       200:
 *         description: The updated note
 *       400:
 *         description: Bad request
 *       403:
 *         description: Authentication failed
 */

/**
 * @swagger
 * /api/notes:
 *   delete:
 *     summary: Delete a note
 *     tags: [Notes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sysUserId:
 *                 type: number
 *               etlSequenceNo:
 *                 type: number
 *     responses:
 *       200:
 *         description: Note deleted successfully
 *       403:
 *         description: Authentication failed
 *       404:
 *         description: Note not found
 */

// Retrieve all notes by user ID and date range
router.get("/user/:id", jwtAuth, findAllNotesByUser);

// Create a new note
router.post("/", jwtAuth, createNote);

// Add a new note with a category (optional)
router.post("/add", jwtAuth, addNewNote);

// Update an existing note
router.put("/", jwtAuth, updateNote);

// Delete a note by user ID and sequence number
router.delete("/", jwtAuth, deleteNote);

export default router;
