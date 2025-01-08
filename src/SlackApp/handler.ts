import { HttpHandler, HttpRequest, InvocationContext } from "@azure/functions";
import { parseRequest } from "../utils/parseRequest";
import { runSlackApp } from "./app";
import { ExpectedConfiguration } from "../types/ExpectedConfiguration";
import { Effect, Context, pipe } from "effect";
import { SlackPayload } from "../types/SlackPayload";
import { Configuration } from "../types/Configuration";

// Rispondo ad una challenge di configurazione Event Slack
const handleChanllenge = (payload: SlackPayload) =>
  Effect.succeed({
    status: 200,
    body: JSON.stringify({ challenge: payload.challenge }),
  });

// Rispondo ad un Event Slack
const handleEvent = (payload: SlackPayload, config: ExpectedConfiguration) => {
  runSlackApp(config)(payload);

  return Effect.succeed({
    status: 202,
  });
};

// Funzione per gestire il payload della richiesta
const isChallengeOrEvent = (
  payload: SlackPayload,
  config: ExpectedConfiguration
) =>
  pipe(
    Effect.succeed(payload),
    Effect.flatMap((payload) =>
      payload && payload.challenge
        ? handleChanllenge(payload)
        : handleEvent(payload, config)
    )
  );

class BuildHandler extends Context.Tag("BuildPokeApiUrl")<
  BuildHandler,
  (conf: ExpectedConfiguration) => HttpHandler
>() {
  static readonly Live = Effect.gen(function* () {
    const config = yield* Configuration; // 👈 Creo la dipendenza

    return BuildHandler.of(() => {
      return async (request: HttpRequest, context: InvocationContext) => {
        context.log(`Running Service ${config.service_name}`);
        const program = pipe(
          parseRequest(request),
          Effect.flatMap((payload) => isChallengeOrEvent(payload, config)),
          Effect.catchTags({
            UnknownException: () =>
              Effect.succeed({
                status: 500,
                body: "Errore interno del server",
              }),
            ContentTypeError: () =>
              Effect.succeed({
                status: 422,
                body: "Content-Type non supportato",
              }),
            JsonError: () =>
              Effect.succeed({
                status: 400,
                body: "JSON mal formato",
              }),
          })
        );
        return Effect.runPromise(program);
      };
    });
  });
}

const program = Effect.gen(function* () {
  const generatedHandler = yield* BuildHandler.Live;
  return yield* Effect.succeed(generatedHandler);
});

const runnable = (config: ExpectedConfiguration) =>
  program.pipe(
    Effect.provideServiceEffect(BuildHandler, BuildHandler.Live),
    Effect.provideServiceEffect(Configuration, Effect.succeed(config))
  );

export const handler = (config: ExpectedConfiguration) => {
  const res = Effect.runSync(runnable(config));
  return res(config);
};
