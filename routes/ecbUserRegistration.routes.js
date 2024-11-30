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
  forgotPassword,
  resetPassword,
  contactSupport,
} from "../controllers/ecbUserRegistration.controller.js";
import jwtAuth from "../jwtAuth.js"; // Import the JWT middleware

const router = Router();

// Specific routes
router.post("/signin", signin);
router.post("/signout", signout);
router.post("/forgotPassword", forgotPassword);
router.post("/resetPassword", resetPassword);
router.post("/contact-support", jwtAuth, contactSupport);

// General CRUD routes
router.post("/", create);
router.get("/", jwtAuth, findAll);
router.get("/sysUserId/:sysUserId", jwtAuth, findBySysUserId);
router.get("/:id", jwtAuth, findOne);
router.put("/:id", jwtAuth, update);
router.delete("/:id", jwtAuth, deleteRecord);

export default router;
