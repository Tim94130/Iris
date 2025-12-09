import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import messagesRouter from "./routes/messages";
import projectsRouter from "./routes/projects";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/messages", messagesRouter);
app.use("/api/projects", projectsRouter);

// Health check endpoint
app.get("/api/health", async (req, res) => {
  const { checkOllamaStatus } = await import("./services/analyzeTranscript");
  const ollamaStatus = await checkOllamaStatus();

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    ollama: ollamaStatus,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.path,
  });
});

// Error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("[Error]", err);
    res.status(500).json({
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 IRIS Backend Server                                      ║
║                                                               ║
║   Server running on: http://localhost:${PORT}                   ║
║                                                               ║
║   Endpoints:                                                  ║
║   • POST   /api/messages         - Send message & analyze     ║
║   • GET    /api/messages/:id     - Get conversation history   ║
║   • DELETE /api/messages/:id     - Clear conversation         ║
║   • GET    /api/projects/:id/summary - Get project summary    ║
║   • GET    /api/health           - Health check               ║
║                                                               ║
║   Ollama: ${process.env.OLLAMA_HOST || "http://localhost:11434"}            ║
║   Model:  ${
    process.env.OLLAMA_MODEL || "llama3.2"
  }                               ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});
