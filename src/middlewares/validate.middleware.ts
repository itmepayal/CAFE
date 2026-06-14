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
        const errors = result.error.flatten();

        throw new BadRequestError(JSON.stringify(errors.fieldErrors));
      }

      req.body = result.data.body ?? req.body;
      req.query = result.data.query ?? req.query;
      req.params = result.data.params ?? req.params;

      next();
    } catch (err) {
      next(err);
    }
  };
