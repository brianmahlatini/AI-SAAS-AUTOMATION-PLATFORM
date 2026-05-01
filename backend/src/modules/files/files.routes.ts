import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/error";
import { createPresignedUpload } from "./files.service";

export const filesRouter = Router();

filesRouter.use(requireAuth);

filesRouter.post(
  "/presign-upload",
  asyncHandler(async (req, res) => {
    const payload = z
      .object({
        fileName: z.string().min(1).max(255),
        contentType: z.string().min(1).max(120)
      })
      .parse(req.body);

    const upload = await createPresignedUpload({
      ownerId: req.auth!.userId,
      fileName: payload.fileName,
      contentType: payload.contentType
    });

    res.status(201).json(upload);
  })
);
