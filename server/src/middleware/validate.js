export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message:
          result.error.issues?.[0]?.message || "Invalid request data",
        errors: result.error.issues,
      });
    }

    req.validated = result.data;
    next();
  };
};