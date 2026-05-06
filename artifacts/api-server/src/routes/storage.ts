import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post("/storage/uploads/request-url", (_req, res) => {
  res.status(501).json({ error: "Object storage not configured" });
});

router.get("/storage/objects/*path", (_req, res) => {
  res.status(404).json({ error: "Object not found" });
});

router.get("/storage/public-objects/*filePath", (_req, res) => {
  res.status(404).json({ error: "Object not found" });
});

export default router;
