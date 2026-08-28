import { Router } from "express";
import {
  createOrUpdateProvider,
  getProviderWhatsAppContact,
  listProviders
} from "../controllers/providerController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { providerListValidator, providerUpsertValidator } from "../validators/providerValidators.js";

const router = Router();

router.get("/", providerListValidator, validate, listProviders);
router.get("/:providerId/whatsapp", protect, getProviderWhatsAppContact);
router.post("/", protect, providerUpsertValidator, validate, createOrUpdateProvider);

export default router;
