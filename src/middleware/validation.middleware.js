import { validationResult } from "express-validator";

const validateRequest = (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "validation Error",
      errors: error.array(),
    });
  }
  next();
};
export { validateRequest };
