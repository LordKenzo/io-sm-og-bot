import { App, ReceiverEvent, StringIndexed } from "@slack/bolt";
import { ExpectedConfiguration } from "../../types/ExpectedConfiguration";
import { Effect, pipe } from "effect";
import { fromNullable } from "effect/Option";
import { ContentTypeError } from "../../utils/customErrors";

const globalForSlackApp = global as unknown as { slackApp: App };

const slackEvent = (payload: StringIndexed): ReceiverEvent => {
  return {
    body: payload,
    /* eslint-disable @typescript-eslint/no-explicit-any */
    ack: async (response: Response): Promise<any> => {
      return {
        statusCode: 200,
        body: response ?? "Go To Mars 🚀",
      };
    },
  };
};

export const runSlackApp =
  (config: ExpectedConfiguration) => async (payload: any) => {
    const slackApp = globalForSlackApp.slackApp || initApp(config);
    if (process.env.NODE_ENV !== "production")
      globalForSlackApp.slackApp = slackApp;

    console.log("Evento processato da Slack App");

    slackApp.processEvent(slackEvent(payload));

    return slackApp;
  };

const initApp = function (config: ExpectedConfiguration) {
  
  console.log("Creo istanza slack app 🚀");

  const app = new App({
    token: config.bot_oauth_token,
    signingSecret: config.signing_secret,
    processBeforeResponse: true,
  });

  app.command("/ver", async ({ ack, say }) => {
    await ack();
    const answer = "eccola: v1.0";
    if (answer) say(answer);
  });

  app.message(async ({ message, say }) => {
    const p = pipe(
      fromNullable(message), // Gestisce il caso in cui `message` sia nullo o indefinito
      Effect.filterOrFail(
        (msg) => msg.subtype === undefined || msg.subtype === "bot_message", // Filtra messaggi validi
        () => new ContentTypeError()
      ),
      Effect.flatMap((msg) =>
        pipe(
          fromNullable(msg.text), // Gestisce il caso in cui `msg.text` sia nullo o indefinito
          Effect.map((text) => [...text].reverse().join("")), // Inverte il testo
          Effect.flatMap(
            (reversedText) => Effect.tryPromise(() => say(reversedText)) // Invia il testo invertito
          )
        )
      )
    );
    Effect.runPromise(p);
  });
  return app;
};
