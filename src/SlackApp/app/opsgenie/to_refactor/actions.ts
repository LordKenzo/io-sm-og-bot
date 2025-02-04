import {
  AllMiddlewareArgs,
  BlockButtonAction,
  SlackActionMiddlewareArgs,
} from "@slack/bolt";
import {
  existRotation,
  formattedData,
  getBaseRotations,
  getCurrentMontTimeline,
  getDayTimeline,
  getFinalRotations,
} from "./timeline";

import { Rotation } from "../../../../types/Opsgenie";
import { createSchedulePayload } from "./payload";
import { createSchedule, deleteSchedule } from "./schedule";
import {
  checkDateTooFar,
  getFormattedDate,
  isDataBeforeToday,
} from "../../../../utils/dateUtility";
import { ExpectedConfiguration } from "../../../../types/ExpectedConfiguration";

const TOKEN = 5;

export const showOnCallAction =
  (config: ExpectedConfiguration) =>
  async ({
    body,
    ack,
    say,
  }: SlackActionMiddlewareArgs<BlockButtonAction> & AllMiddlewareArgs) => {
    await ack();
    if (!body || !body.actions || !body.actions[0] || !body.actions[0].value) {
      return;
    }

    const data = await getCurrentMontTimeline(config)();

    const email = body.actions[0].value;
    const rotations = data.data.baseTimeline.rotations
      ? data.data.baseTimeline.rotations
      : [];
    const rotationsFinal = data.data.finalTimeline.rotations
      ? data.data.finalTimeline.rotations
      : [];
    console.log(`baseRotations: ${rotationsFinal}`);
    const baseRotations = getBaseRotations(rotations, email);
    const [finalRotations, tokenSpesi] = getFinalRotations(
      rotationsFinal,
      email
    );
    console.log(`baseRotations: ${baseRotations}`);

    await say(`Ecco i dettagli del turno di reperibilità per ${email} \n\r`);

    await say(`Hai ancora ${TOKEN - tokenSpesi} Token da spendere`);

    baseRotations.map(async (rotation: Rotation) => {
      if (rotation.periods) {
        await say(
          `ID PRENOTAZIONE: ${rotation.id} Dal: ${formattedData(
            rotation.periods[0].startDate
          )} al: ${formattedData(rotation.periods[0].endDate)}`
        );
      }
    });

    finalRotations.map(async (rotation: Rotation) => {
      if (rotation.periods) {
        await say(
          `PRENOTAZIONE PASSATA: ${rotation.id} Dal: ${formattedData(
            rotation.periods[0].startDate
          )} al: ${formattedData(rotation.periods[0].endDate)}`
        );
      }
    });
  };

export const addOnCallAction = async ({
  body,
  ack,
  say,
}: SlackActionMiddlewareArgs<BlockButtonAction> & AllMiddlewareArgs) => {
  await ack();
  if (!body || !body.actions || !body.actions[0] || !body.actions[0].value) {
    return;
  }
  await say("Dammi la data");
};

export const delectOnCallAction = async ({
  body,
  ack,
  say,
}: SlackActionMiddlewareArgs<BlockButtonAction> & AllMiddlewareArgs) => {
  await ack();
  if (!body || !body.actions || !body.actions[0] || !body.actions[0].value) {
    return;
  }
  await say(`Dammi l'ID`);
};

export const confirmOnCallAction =
  (config: ExpectedConfiguration) =>
  (isBot?: boolean) =>
  async ({
    body,
    ack,
    say,
  }: SlackActionMiddlewareArgs<BlockButtonAction> & AllMiddlewareArgs) => {
    await ack();
    if (
      !body ||
      !body.actions ||
      !body.actions[0] ||
      !body.actions[0].value ||
      !body.channel ||
      !body.channel.id
    ) {
      return;
    }

    const botData = body.actions[0].value;
    const originalMessage = body.message?.text || "Nessun messaggio trovato";
    console.log("Messaggio originale:", originalMessage);
    const threadTs = body.message?.ts;
    const uuidRegex =
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const matchUUID = originalMessage.match(uuidRegex);
    const extractedUUID = matchUUID ? matchUUID[0] : null;
    const containsUUID = uuidRegex.test(originalMessage);
    console.log("UUID estratto:", extractedUUID);
    console.log("Contiene UUID:", containsUUID);

    const getData = originalMessage.split(":")[1]?.trim();
    console.log("getData", getData);
    console.log("botData", botData);
    const dataInput = isBot ? botData : getData;
    if (!containsUUID) {
      try {
        const dataFormattata = getFormattedDate(dataInput, "DD-MM-YYYY");
        console.log("DATA FORMATTA", dataFormattata);
        const isBefore = isDataBeforeToday(dataFormattata);
        console.log("DATA BEFORE", isBefore);

        if (checkDateTooFar(dataFormattata)) {
          await say({
            text: "Non è possibile prenotare turni oltre le due settimane dalla data corrente.",
            thread_ts: threadTs,
          });
          return;
        }

        const res = await getDayTimeline(config)(dataFormattata);
        console.log(JSON.stringify(res));
        if (
          res.data.baseTimeline.rotations &&
          !existRotation(res.data.baseTimeline.rotations)
        ) {
          const data = await getCurrentMontTimeline(config)();

          const email = body.actions[0].value;

          const rotationsFinal = data.data.finalTimeline.rotations
            ? data.data.finalTimeline.rotations
            : [];
          const [, tokenSpesi] = getFinalRotations(rotationsFinal, email);

          console.log("TOKEN", tokenSpesi);
          if (TOKEN - tokenSpesi <= 0 && !isBot) {
            await say({
              text: "Hai già speso tutti i token del mese.",
              thread_ts: threadTs,
            });
            return;
          }
          const payload = createSchedulePayload(
            isBot ? `${body.user.username}@pagopa.it` : body.actions[0].value,
            dataInput,
            isBot ? "BOT" : "USER"
          );
          console.log(payload);
          const responseCreate = await createSchedule(config)(payload);

          if (responseCreate.status === 201) {
            await say({
              text: `Turno di reperebilità inserito: "${dataInput}" ${responseCreate.data.data.id}`,
              thread_ts: threadTs,
            });
          } else if (responseCreate.status === 422) {
            await say({
              text: `Turno già presente: "${dataInput}"`,
              thread_ts: threadTs,
            });
          } else {
            await say({
              text: `Errore: "${responseCreate.status}"`,
              thread_ts: threadTs,
            });
          }
        } else {
          await say({
            text: `Turno già presente :( ): "${dataInput}"`,
            thread_ts: threadTs,
          });
        }
      } catch (e) {
        console.log("errore", e);
      }
    } else {
      try {
        if (!extractedUUID) {
          await say({
            text: `Nessun ID valido trovato: "${containsUUID}"`,
            thread_ts: threadTs,
          });
          return;
        }
        const responseDelete = await deleteSchedule(config)(extractedUUID);

        if (responseDelete.status === 200) {
          await say({
            text: `Cancellazione turno: "${extractedUUID}"`,
            thread_ts: threadTs,
          });
        } else if (responseDelete.status === 422) {
          await say({
            text: `Turno non presente: "${extractedUUID}"`,
            thread_ts: threadTs,
          });
        } else {
          await say({
            text: `Errore: "${responseDelete.status}"`,
            thread_ts: threadTs,
          });
        }
      } catch (e) {
        console.log("errore", e);
      }
    }
  };
