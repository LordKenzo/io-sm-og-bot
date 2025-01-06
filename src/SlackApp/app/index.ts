class App {
  name: string;
  constructor({}) {
    const createdAt = new Date();

    this.name = `Istanza creata ${createdAt.getHours()}:${createdAt.getMinutes()}:${createdAt.getSeconds()}`;
    console.log("Creata classe slack App");
  }
}

export const runSlackApp = (payload: any) => {
  const globalForSlackApp = global as unknown as { slackApp: App };

  const slackApp =
    globalForSlackApp.slackApp ||
    new App({
      token: "xoxb-PRENDILO-DA-ENV",
      signingSecret: "dfc-PRENDILO-DA-ENV",
      processBeforeResponse: true,
    });

  if (process.env.NODE_ENV !== "production")
    globalForSlackApp.slackApp = slackApp;
  console.log(`Utilizzo SlackApp creata: ${slackApp.name}`);
  return slackApp;
};
