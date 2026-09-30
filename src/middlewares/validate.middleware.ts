import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { BadRequestError } from "../utils/errors/app.error";

export const validate =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!result.success) {
        const formattedErrors: Record<string, string[]> = {};
        result.error.issues.forEach((issue) => {
          const path = issue.path.join(".");
          if (!formattedErrors[path]) formattedErrors[path] = [];
          formattedErrors[path].push(issue.message);
        });

        throw new BadRequestError(JSON.stringify(formattedErrors));
      }

      if (result.data.body) {
        req.body = result.data.body;
      }

      if (result.data.query) {
        Object.assign(req.query, result.data.query);
      }

      if (result.data.params) {
        Object.assign(req.params, result.data.params);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
