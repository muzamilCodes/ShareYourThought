import { Router } from "express";
import {
  approveProvider,
  getDashboardStats,
  listBookingsAdmin,
  listProvidersAdmin,
  listUsers
} from "../controllers/adminController.js";
import { protect } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roles.js";
import { ROLES } from "../constants/roles.js";

const router = Router();

router.use(protect, authorizeRoles(ROLES.ADMIN));
router.get("/stats", getDashboardStats);
router.get("/users", listUsers);
router.get("/providers", listProvidersAdmin);
router.get("/bookings", listBookingsAdmin);
router.patch("/providers/:providerId/approve", approveProvider);

export default router;
