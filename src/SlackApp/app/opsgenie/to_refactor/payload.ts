import { parse, format, add, getDay, getYear } from "date-fns";
import { it } from "date-fns/locale";
import { SchedulePayload } from "../../../../types/Opsgenie";

const convertDate = (dateString: string): string => {
  // Aggiungi l'anno corrente alla stringa della data
  const fullDateString = `${dateString} ${getYear(Date.now())}`;

  // Analizza la stringa della data
  const parsedDate = parse(fullDateString, "d MMMM yyyy", new Date(), {
    locale: it,
  });

  // Formatta la data nel formato desiderato (solo data senza orario e timezone)
  const formattedDate = format(parsedDate, "yyyy-MM-dd");

  return formattedDate;
};

export const createSchedulePayload = (
  email: string,
  dateString: string,
  typeSchedule: "USER" | "BOT"
): SchedulePayload => {
  console.log(`dateString ${dateString} ${getYear(Date.now())}`);
  const initialDate = convertDate(dateString);
  const dayOfWeek = getDay(initialDate);

  console.log(`initialDate ${initialDate}`);

  let startDate, endDate, timeRestriction;

  if (dayOfWeek === 6 || dayOfWeek === 0) {
    // Sabato
    startDate = format(
      add(initialDate, { hours: 8 }),
      "yyyy-MM-dd'T'HH:mm:ssXXX"
    );
    endDate = format(
      add(initialDate, { days: 1, hours: 8 }),
      "yyyy-MM-dd'T'HH:mm:ssXXX"
    );
  } else {
    startDate = format(
      add(initialDate, { hours: 17 }),
      "yyyy-MM-dd'T'HH:mm:ssXXX"
    );
    endDate = format(
      add(initialDate, { days: 1, hours: 8 }),
      "yyyy-MM-dd'T'HH:mm:ssXXX"
    );
    timeRestriction = {
      type: "time-of-day",
      restriction: {
        startHour: 18,
        startMin: 0,
        endHour: 9,
        endMin: 0,
      },
    };
  }

  const basePayload = {
    name: `${typeSchedule}-${initialDate}`,
    startDate: startDate,
    endDate: endDate,
    type: "daily",
    length: 1,
    participants: [
      {
        type: "user",
        username: email,
      },
    ],
  };

  return timeRestriction ? { ...basePayload, timeRestriction } : basePayload;
};
