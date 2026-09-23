import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

type RequestValidationSchema = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

export const validate = (schema: RequestValidationSchema): RequestHandler => {
  return (req, res, next) => {
    const validated = {
      body: schema.body ? schema.body.parse(req.body) : undefined,
      params: schema.params ? schema.params.parse(req.params) : undefined,
      query: schema.query ? schema.query.parse(req.query) : undefined
    };

    res.locals.validated = validated;
    next();
  };
};
