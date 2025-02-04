import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { Rotation, TimelineResponse } from "../../../types/Opsgenie";
import { ExpectedConfiguration } from "../../../types/ExpectedConfiguration";

export const getCurrentMontTimeline =
  (config: ExpectedConfiguration) => async (): Promise<TimelineResponse> => {
    try {
      console.log(
        `https://api.opsgenie.com/v2/schedules/${config.opsgenie_schedule_id}/timeline?expand=base&intervalUnit=months`
      );
      const response = await fetch(
        `https://api.opsgenie.com/v2/schedules/${config.opsgenie_schedule_id}/timeline?expand=base&intervalUnit=months`,
        {
          headers: {
            Authorization: `GenieKey ${config.opsgenie_api_key}`,
          },
        }
      );
      const data = (await response.json()) as TimelineResponse;
      return data;
    } catch (e) {
      throw new Error(`Opsgenie API error ${JSON.stringify(e)}`);
    }
  };

export const getDayTimeline =
  (config: ExpectedConfiguration) =>
  async (timeDate: string): Promise<TimelineResponse> => {
    const [day, month, year] = timeDate.split("-");

    // Creo una data per verificare il giorno della settimana
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const dayOfWeek = date.getDay();

    // Se è tra lunedì (1) e venerdì (5), usa 18:00, altrimenti 09:00
    const time = dayOfWeek >= 1 && dayOfWeek <= 5 ? "18:00:00Z" : "09:00:00Z";
    const convertedDate = `${year}-${month}-${day}T${time}`;

    try {
      const response = await fetch(
        `https://api.opsgenie.com/v2/schedules/${config.opsgenie_schedule_id}/timeline?expand=base&intervalUnit=days&interval=1&date=${convertedDate}`,
        {
          headers: {
            Authorization: `GenieKey ${config.opsgenie_api_key}`,
          },
        }
      );
      const data = (await response.json()) as TimelineResponse;
      return data;
    } catch (e) {
      throw new Error(`Opsgenie API error ${JSON.stringify(e)}`);
    }
  };

export const existRotation = (rotations: Array<Rotation>): boolean => {
  return rotations.some(
    (rotation: Rotation) => rotation.periods && rotation.periods.length > 0
  );
};

export const formattedData = (data: string) => {
  const parsedData = parseISO(data);
  return format(parsedData, "d MMMM 'alle ore' HH:mm", { locale: it });
};

export const getBaseRotations = (rotations: Array<Rotation>, email: string) => {
  return rotations.filter((rotation: Rotation) => {
    if (rotation.periods && rotation.periods.length > 0) {
      const userMail = rotation.periods[0].recipient.name;
      return userMail === email;
    }
    return false;
  });
};

export const getFinalRotations = (
  rotations: Array<Rotation>,
  email: string
): [Array<Rotation>, number] => {
  let tokenSpesi = 0;

  const rotazioniUtentePassate = rotations.filter((rotation: Rotation) => {
    if (rotation.periods && rotation.periods.length > 0) {
      const userMail = rotation.periods[0].recipient.name;
      if (!rotation.name.startsWith("BOT") && userMail === email) tokenSpesi++;
      return userMail === email && rotation.periods[0].type === "historical";
    }
    return false;
  });

  return [rotazioniUtentePassate, tokenSpesi];
};

export const getToken = (rotations: Array<Rotation>): number => {
  let tokenSpesi = 0;

  rotations.map((rotation: Rotation) => {
    if (rotation.periods && rotation.periods.length > 0) {
      if (!rotation.name.startsWith("BOT")) tokenSpesi++;
    }
    return false;
  });

  return tokenSpesi;
};
