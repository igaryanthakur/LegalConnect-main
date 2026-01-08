// Simple health check endpoint for Vercel
export default function handler(req, res) {
  res.status(200).json({
    status: "ok",
    message: "LawSphere API is running",
    timestamp: new Date().toISOString(),
  });
}
