import { app } from "@azure/functions";
import { handler } from "./handler";

export default app.http("Info", {
  methods: ["GET"], // 👈️ metodi accettati
  authLevel: "anonymous",
  route: "v1/info", // 👈️ endpoint: api/v1/info
  handler, // il nostro handler per l'endpoint
});
