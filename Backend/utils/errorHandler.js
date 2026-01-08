/**
 * Standardized error handler for API controllers
 * @param {Function} fn - Controller function to wrap with error handling
 * @returns {Function} Wrapped controller with error handling
 */
export const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    console.error(`API Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Server error occurred",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Log errors without crashing the serverless function
 * @param {Error} error - Error to log
 * @param {string} context - Where the error occurred
 */
export const logError = (error, context = "General") => {
  console.error(`[${context}] Error:`, error.message);
  if (process.env.NODE_ENV === "development") {
    console.error(error.stack);
  }
};
