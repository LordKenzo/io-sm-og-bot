import { HttpHandler, HttpRequest, InvocationContext } from "@azure/functions";
import { parseBodyEffect, readHeader } from "../utils/parseRequest";
import { runSlackApp } from "./app";
import { ExpectedConfiguration } from "../types/ExpectedConfiguration";
import { Effect, Context, pipe } from "effect";
import { ContentTypeError } from "../utils/customErrors";

export class Configuration extends Context.Tag("Configuration")<
  Configuration,
  ExpectedConfiguration
>() {}

export class BuildHandler extends Context.Tag("BuildPokeApiUrl")<
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

          Effect.tap((payload) => console.log(payload)),
          Effect.andThen((payload) => {
            if (payload && payload.challenge) {
              const { challenge } = payload;
              return {
                status: 200,
                body: JSON.stringify({
                  challenge,
                }),
              };
            }

            runSlackApp(config)(payload);

            return {
              status: 202,
            };
          })
        ).pipe(
          Effect.catchTags({
            ContentTypeError: () =>
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
