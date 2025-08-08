import { Router, Request, Response } from "express";
import multer from "multer";
import { z } from "zod";
import { parseDocx } from "./utils/parseDocx";
import { handlePushEvent } from "./services/githubHandler";
import { notifySlack } from "./services/slack";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.get("/hello", (_req: Request, res: Response) => {
  res.json({ message: "Hello, World!" });
});

// Upload DOCX rules
router.post(
  "/upload-rules",
  upload.single("rulesFile"),
  async (req: Request, res: Response) => {
    try {
      const filePath = req.file?.path;
      if (!filePath) {
        return res.status(400).json({ error: "rulesFile is required" });
      }
      const rules = await parseDocx(filePath);
      // TODO: persist rules to DB/cache
      res.json({ message: "Rules uploaded successfully", rules });
    } catch (error) {
      res.status(500).json({ error: "Failed to parse rules document." });
    }
  }
);

// GitHub webhook endpoint (expects JSON payload from GitHub)
router.post("/github-webhook", async (req: Request, res: Response) => {
  try {
    console.log("Webhook received:", JSON.stringify(req.body, null, 2));
    // Optionally validate event type/signature here
    await handlePushEvent(req.body);
    res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send("Error processing webhook");
  }
});

// Simple schema validation example
router.post("/echo", (req: Request, res: Response) => {
  const schema = z.object({
    message: z.string().min(1, "Message is required"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  res.json({ success: true, data: parsed.data });
});

// Minimal Slack notify test route
router.post("/notify", async (req: Request, res: Response) => {
  const schema = z.object({ text: z.string().min(1), channel: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    await notifySlack(parsed.data.text, parsed.data.channel);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to send Slack message" });
  }
});

export default router;