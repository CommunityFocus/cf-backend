import { Router } from "express";
import { contributorsHandler, slugHandler } from "../controllers/apiController";

const router = Router();
router.get("/getContributors", contributorsHandler);
router.get("/getSlug", slugHandler);

export default router;
