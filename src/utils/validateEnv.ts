import { Effect, Config, Either } from "effect";
import type { ExpectedConfiguration } from "../types/ExpectedConfiguration";
import type { ConfigError } from "effect/ConfigError";
/*
Poiché un valore di configurazione mancante è un errore di implementazione, è comune non gestire ConfigError (ovvero, non utilizzare catchTag su di esso)
*/

const program = Effect.gen(function* () {
  const service_name = yield* Config.string("SERVICE_NAME").pipe(
    Config.withDefault("Slack Bot")
  );
  const bot_oauth_token = yield* Config.string("SLACK_BOT_OAUTH_TOKEN");
  const signing_secret = yield* Config.string("SLACK_SIGNING_SECRET");
  const opsgenie_api_key = yield* Config.string("OPSGENIE_API_KEY");
  const opsgenie_schedule_id = yield* Config.string("OPSGENIE_SCHEDULE_ID");
  const reperibilita_channel_id = yield* Config.string(
    "REPERIBILITA_CHANNEL_ID"
  );
  return {
    service_name,
    bot_oauth_token,
    signing_secret,
    opsgenie_api_key,
    opsgenie_schedule_id,
    reperibilita_channel_id,
  };
});

const config = Effect.gen(function* () {
  const failureOrSuccess = yield* Effect.either(program);
  if (Either.isLeft(failureOrSuccess)) {
    const error = failureOrSuccess.left;
    return yield* Effect.fail(error);
  } else {
    return failureOrSuccess.right;
  }
});

export const getConfig = (): Effect.Effect<
  ExpectedConfiguration,
  ConfigError,
  never
> => {
  return config;
};
