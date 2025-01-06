import { app } from "@azure/functions";
import { handler } from "./handler";

export default app.http("SlackApp", {
  methods: ["GET", "POST"], // 👈️ metodi accettati
  authLevel: "anonymous",
  route: "v1/slack", // 👈️ endpoint: api/v1/slack
  handler, // il nostro handler per l'endpoint
});