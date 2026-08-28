import { Router } from "express";
import {
  createSystemBooking,
  generateWhatsAppBookingLink,
  listMyBookings,
  updateBookingStatus
} from "../controllers/bookingController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { authorizeRoles } from "../middleware/roles.js";
import { bookingBaseValidator, bookingListValidator, bookingStatusValidator } from "../validators/bookingValidators.js";
import { ROLES } from "../constants/roles.js";

const router = Router();

router.use(protect);
router.get("/me", bookingListValidator, validate, listMyBookings);
router.post("/system", bookingBaseValidator, validate, createSystemBooking);
router.post("/whatsapp-link", bookingBaseValidator, validate, generateWhatsAppBookingLink);
router.patch(
  "/:bookingId/status",
  authorizeRoles(ROLES.ADMIN, ROLES.PROVIDER),
  bookingStatusValidator,
  validate,
  updateBookingStatus
);

export default router;
