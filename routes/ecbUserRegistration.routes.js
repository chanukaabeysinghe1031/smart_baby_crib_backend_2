import { Router } from "express";
import {
  create,
  findAll,
  findOne,
  update,
  deleteRecord,
} from "../controllers/ecbUserRegistration.controller.js";
import jwtAuth from "../jwtAuth.js"; // Import the JWT middleware

const router = Router();

// Create new record
router.post("/", create);

// Get all records
router.get("/", jwtAuth, findAll);

// Get one record by user id
router.get("/:id", jwtAuth, findOne);

// Update one record by user id
router.put("/:id", jwtAuth, update);

// Delete one record by user id
router.delete("/:id", jwtAuth, deleteRecord);

export default router;
