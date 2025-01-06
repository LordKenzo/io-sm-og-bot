import { app } from "@azure/functions";
import { handler } from "./handler";
import { getConfig } from "./utils/validateEnv";
import { Effect, Either } from "effect";

const runnable = Effect.gen(function* () {
  const configOrFail = yield* Effect.either(getConfig());
  if (Either.isLeft(configOrFail)) {
    const error = configOrFail.left;
    console.log(error);
    throw new Error(`Errore lettura configurazione ${error}`);
  }
  return configOrFail.right;
});

const config = Effect.runSync(runnable);

export default app.http("SlackApp", {
  methods: ["GET", "POST"], // 👈️ metodi accettati
  authLevel: "anonymous",
  route: "v1/slack", // 👈️ endpoint: api/v1/slack
  handler: handler(config), // il nostro handler per l'endpoint
});
