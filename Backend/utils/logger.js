/**
 * Safe logging utility for serverless environments
 * Ensures logs don't crash the serverless function
 */

export const logger = {
  info: (message, ...args) => {
    try {
      console.log(`[INFO] ${message}`, ...args);
    } catch (error) {
      console.log("Logger error in info method");
    }
  },

  error: (message, error = null) => {
    try {
      if (error) {
        console.error(
          `[ERROR] ${message}`,
          error.message || error,
          process.env.NODE_ENV === "development" ? error.stack : ""
        );
      } else {
        console.error(`[ERROR] ${message}`);
      }
    } catch (logError) {
      console.error("Logger error in error method");
    }
  },

  warn: (message, ...args) => {
    try {
      console.warn(`[WARN] ${message}`, ...args);
    } catch (error) {
      console.log("Logger error in warn method");
    }
  },

  debug: (message, ...args) => {
    try {
      if (process.env.NODE_ENV === "development") {
        console.debug(`[DEBUG] ${message}`, ...args);
      }
    } catch (error) {
      console.log("Logger error in debug method");
    }
  },
};
