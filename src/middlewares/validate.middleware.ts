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
