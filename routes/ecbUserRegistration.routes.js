import { Router } from "express";
import {
  create,
  findAll,
  findOne,
  findBySysUserId,
  update,
  deleteRecord,
  signin,
  signout,
} from "../controllers/ecbUserRegistration.controller.js";
import jwtAuth from "../jwtAuth.js"; // Import the JWT middleware

const router = Router();

// Create new record
router.post("/", create);

// signin
router.post("/signin", signin);

// signout
router.post("/signout", signout);

// Get all records
router.get("/", jwtAuth, findAll);

// Get one record by user id
router.get("/:id", jwtAuth, findOne);

// Update one record by user id
router.put("/:id", jwtAuth, update);

// Delete one record by user id
router.delete("/:id", jwtAuth, deleteRecord);

// Get one record by sysUserId (Update this to sysUserId)
router.get("/sysUserId/:sysUserId", jwtAuth, findBySysUserId);

export default router;
