import { App } from "@slack/bolt";
import { pipe, Effect } from "effect";
import { SlackUserRetrieveError } from "../../../utils/customErrors";
import {
  showOnCallAction,
  addOnCallAction,
  delectOnCallAction,
  confirmOnCallAction,
} from "./to_refactor/actions";
import { ExpectedConfiguration } from "../../../types/ExpectedConfiguration";
import { MessageWithTextAndUser } from "../../../types/Slack";

const generateSuggestion = (text: string, email: string) => {
  const suggestions = [
    ...["cancella", "elimina"].map((trigger) => ({
      trigger,
      text: "Vuoi eliminare un turno?",
      actions: [
        {
          text: "Visualizza i miei turni",
          value: email,
          id: "show_on-call",
        },
        { text: "Elimina turno", value: "1", id: "remove_on-call" },
      ],
    })),
    {
      trigger: text.match(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
      )
        ? text
        : "cancella il turno",
      text: `Vuoi cancellare il turno con ID: ${text}`,
      actions: [{ text: "Confermi?", value: `${text}`, id: "confirm_on-call" }],
    },
    ...[
      "gennaio",
      "febbraio",
      "marzo",
      "aprile",
      "maggio",
      "giugno",
      "luglio",
      "agosto",
      "settembre",
      "ottobre",
      "novembre",
      "dicembre",
    ].map((trigger) => ({
      trigger,
      text: `Vediamo se ho capito il turno di reperibilità: ${text}`,
      actions: [{ text: "Confermi?", value: email, id: "confirm_on-call" }],
    })),
    ...["reperibilità", "turno", "turni", "oncall", "opsgenie"].map(
      (trigger) => ({
        trigger,
        text: "Hai bisogno di aggiungere il turno di reperibilità?",
        actions: [
          { text: "Visualizza i miei turni", value: email, id: "show_on-call" },
          { text: "Gestisci turno", value: "1", id: "add_on-call" },
        ],
      })
    ),
    {
      trigger: text.match(
        /\b(([1-9]|[12][0-9]|3[01])\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre))\b/i
      )
        ? text
        : "data non valida",
      text: `Vediamo se ho capito il turno di reperibilità: ${text}`,
      actions: [{ text: "Confermi?", value: email, id: "confirm_on-call" }],
    },
  ];

  return suggestions.find((s) => text.toLowerCase().includes(s.trigger));
};

const isMessageWithTextAndUser = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: any
): message is MessageWithTextAndUser => {
  return (
    "text" in message &&
    typeof message.text === "string" &&
    !!message.text &&
    !!message.user
  );
};

export const setupInteractiveSuggestions =
  (config: ExpectedConfiguration) => (app: App) => {
    app.message(async ({ message, say, client }) => {
      if ("text" in message && message.text) {
        const program = pipe(
          // Inizia con il messaggio come valore iniziale
          Effect.succeed(message),

          // Filtra se il messaggio ha `text` e il valore non è vuoto
          Effect.filterOrFail(
            isMessageWithTextAndUser, // usa il tuo type predicate qui
            () => new SlackUserRetrieveError()
          ),

          Effect.flatMap((message) =>
            Effect.tryPromise({
              try: () =>
                client.users.info({
                  user: message.user as string,
                }),
              catch: () => new SlackUserRetrieveError(),
            })
          ),

          Effect.filterOrFail(
            (result) =>
              result.user !== undefined && // Se non c'è `user`
              result.user.profile !== undefined && // Se non c'è `profile` in `user`
              result.user.profile.email !== undefined, // Se non c'è `email` in `profile`
            (e) => new Error(`${JSON.stringify(e)}`)
          ),

          Effect.andThen(async (result) => {
            const email = result.user!.profile!.email; // abbiamo verificato
            const suggestion = generateSuggestion(
              message.text as string,
              email! // verificato
            );
            if (suggestion) {
              await say(`Ciao, <@${message.user}> - ${email}`);

              await say({
                text: suggestion.text,
                blocks: [
                  {
                    type: "section",
                    text: { type: "mrkdwn", text: suggestion.text },
                  },
                  {
                    type: "actions",
                    elements: suggestion.actions.map((action) => ({
                      type: "button",
                      text: { type: "plain_text", text: action.text },
                      // value: email,
                      value: action.value,
                      // action_id: action.value,
                      action_id: action.id,
                    })),
                  },
                ],
              });
            }
          })
        );
        Effect.runPromise(program);
      }
    });

    app.action("show_on-call", showOnCallAction(config));
    app.action("add_on-call", addOnCallAction);
    app.action("remove_on-call", delectOnCallAction);
    app.action("confirm_on-call", confirmOnCallAction(config)());
    app.action("confirm_on-call-bot", confirmOnCallAction(config)(true));
  };
