const errorHandler = (err, req, res, next) => {
  console.error("❌ Global Error:", err);

  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === "production";

  res.status(statusCode).json({
    success: false,
    message:
      isProduction && statusCode >= 500
        ? "Internal Server Error"
        : err.message || "Internal Server Error",
  });
};

export default errorHandler;