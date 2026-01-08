import { protect } from "../config/auth.js";

// Re-export the protect middleware as authenticate
export const authenticate = protect;
