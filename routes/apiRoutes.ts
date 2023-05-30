import { Router } from "express";
import { slugHandler } from "@controllers/apiController";

const router = Router();
router.get("/getSlug", slugHandler);

export default router;
