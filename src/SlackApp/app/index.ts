import { App, ReceiverEvent, StringIndexed } from "@slack/bolt";
import { ExpectedConfiguration } from "../../types/ExpectedConfiguration";

const globalForSlackApp = global as unknown as { slackApp: App };

const slackEvent = (payload: StringIndexed): ReceiverEvent => {
  return {
    body: payload,
    /* eslint-disable @typescript-eslint/no-explicit-any */
    ack: async (response: Response): Promise<any> => {
      return {
        statusCode: 200,
        body: response ?? "",
      };
    },
  };
};

export const runSlackApp =
  (config: ExpectedConfiguration) => async (payload: any) => {
    const slackApp =
      globalForSlackApp.slackApp ||
      (function () {
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
          console.log(message);
          if (message) {
            if (
              message.subtype === undefined ||
              message.subtype === "bot_message"
            ) {
              if (message.text) {
                const reversedText = [...message.text].reverse().join("");
                await say(reversedText);
              }
            }
          }
        });
        return app;
      })();

    if (process.env.NODE_ENV !== "production")
      globalForSlackApp.slackApp = slackApp;

    console.log("Evento processato da Slack App");

    slackApp.processEvent(slackEvent(payload));

    return slackApp;
  };
