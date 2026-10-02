import { Request, Response, NextFunction } from "express";
import { unlink } from "node:fs/promises";
import { registerCafeSchema } from "./cafe.validation";
import { BadRequestError } from "../../utils/errors/app.error";

export const validateCafeRegistration = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const result = registerCafeSchema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    const files = Object.values(req.files ?? {}).flat() as Express.Multer.File[];
    await Promise.allSettled(files.map((file) => unlink(file.path)));
    const errors: Record<string, string[]> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join(".");
      (errors[path] ??= []).push(issue.message);
    });
    return next(new BadRequestError(JSON.stringify(errors)));
  }

  req.body = result.data.body;
  return next();
};
