import { ExpectedConfiguration } from "../types/ExpectedConfiguration";

class App {
  name: string;
  constructor({}) {
    const createdAt = new Date();

    this.name = `Istanza creata ${createdAt.getHours()}:${createdAt.getMinutes()}:${createdAt.getSeconds()}`;
    console.log("Creata classe slack App");
  }
}

export const runSlackApp =
  (config: ExpectedConfiguration) => (payload: any) => {
    const globalForSlackApp = global as unknown as { slackApp: App };

    const slackApp =
      globalForSlackApp.slackApp ||
      new App({
        token: config.bot_oauth_token,
        signingSecret: config.signing_secret,
        processBeforeResponse: true,
      });

    if (process.env.NODE_ENV !== "production")
      globalForSlackApp.slackApp = slackApp;
    console.log(`Utilizzo SlackApp creata: ${slackApp.name}`);
    return slackApp;
  };
