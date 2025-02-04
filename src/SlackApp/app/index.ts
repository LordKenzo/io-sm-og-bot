import { App, ReceiverEvent, StringIndexed } from "@slack/bolt";
import { ExpectedConfiguration } from "../../types/ExpectedConfiguration";
import { setupInteractiveSuggestions } from "./opsgenie/interactions";

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

  setupInteractiveSuggestions(config)(app);
  
  return app;
};
