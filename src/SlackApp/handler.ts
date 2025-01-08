import { HttpHandler, HttpRequest, InvocationContext } from "@azure/functions";
import { parseBodyEffect, readHeader } from "../utils/parseRequest";
import { runSlackApp } from "./app";
import { ExpectedConfiguration } from "../types/ExpectedConfiguration";
import { Effect, Context, pipe } from "effect";

class Configuration extends Context.Tag("Configuration")<
  Configuration,
  ExpectedConfiguration
>() {}

const replyToChallenge = (payload: { challenge: string }) => {
  console.log("CREO replyToChallenge");
  return Effect.succeed({
    status: 200,
    body: JSON.stringify({ challenge: payload.challenge }),
  });
};

const eventToSlack = (
  payload: { challenge: string },
  config: ExpectedConfiguration
) => {
  console.log("CREO eventToSlack");
  runSlackApp(config)(payload);

  return Effect.succeed({
    status: 202,
  });
};

// Funzione per gestire il payload della richiesta
const isChallengeOrEvent = (payload: any, config: ExpectedConfiguration) =>
  pipe(
    Effect.orElse(
      pipe(
        Effect.succeed(payload),
        Effect.filterOrFail((payload) => payload && payload.challenge),
        Effect.flatMap(replyToChallenge)
      ),
      () => eventToSlack(payload, config)
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
          Effect.tryPromise(() => request.text()),

          Effect.flatMap((body) =>
            pipe(
              readHeader(request, "content-type"),
              Effect.flatMap((contentType) =>
                parseBodyEffect(body, contentType)
              )
            )
          ),
          // Effect.tap((payload) => console.log(payload)),
          Effect.andThen((payload) => {
            return isChallengeOrEvent(payload, config);
          })
        ).pipe(
          Effect.catchTags({
            UnknownException: () =>
              Effect.succeed({
                status: 500,
              }),
            ContentTypeError: () =>
              Effect.succeed({
                status: 422,
              }),
            JsonError: () =>
              Effect.succeed({
                status: 400,
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
