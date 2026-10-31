import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MediCare AI-Powered Healthcare & Doctor Appointment API",
      version: "2.0.0",
      description:
        "Production-grade RESTful API for MediCare: Doctor discovery, atomic concurrency-safe appointment scheduling, AI healthcare assistant (MediAssist AI RAG), Razorpay payment verification, and administrative analytics.",
      contact: {
        name: "MediCare Engineering Team",
        email: "support@medicare.local",
      },
    },
    servers: [
      {
        url: "http://localhost:8080/api/v1",
        description: "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./routes/*.js", "./server.js"],
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

export const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
};
