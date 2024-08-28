import { Router } from "express";
import {
  create,
  findAll,
  findOne,
  update,
  deleteRecord,
} from "../controllers/ecbDeviceRegistration.controller.js";
import jwtAuth from "../jwtAuth.js"; // Import the JWT middleware

const router = Router();

// Create new record
router.post("/", jwtAuth, create);
router.post("/withoutJWT", create);

// Get all records
router.get("/", jwtAuth, findAll);
router.get("/withoutJWT", findAll);

// Get one record by user id
router.get("/:id", jwtAuth, findOne);
router.get("/withoutJWT/:id", findOne);

// Update one record by user id
router.put("/:id", jwtAuth, update);
router.put("/withoutJWT/:id", update);

// Delete one record by user id
router.delete("/:id", jwtAuth, deleteRecord);
router.delete("/withoutJWT/:id", deleteRecord);

export default router;
