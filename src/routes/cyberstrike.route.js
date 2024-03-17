import { Router } from "express";
import { blog } from "../controllers/cyberstrikeControllers.js";

const cyberStrikeRouter = Router();

cyberStrikeRouter.get("/", blog);

export default cyberStrikeRouter;