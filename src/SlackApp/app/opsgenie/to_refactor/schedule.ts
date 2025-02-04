import { ExpectedConfiguration } from "../../../../types/ExpectedConfiguration";
import {
  DeleteResponse,
  SchedulePayload,
  ScheduleResponse,
} from "../../../../types/Opsgenie";

export const createSchedule =
  (config: ExpectedConfiguration) =>
  async (payload: SchedulePayload): Promise<ScheduleResponse> => {
    try {
      const response = await fetch(
        `https://api.opsgenie.com/v2/schedules/${config.opsgenie_schedule_id}/rotations`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `GenieKey ${config.opsgenie_api_key}`,
          },
          method: "POST",

          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      return {
        data,
        status: response.status,
      };
    } catch (e) {
      throw new Error(`Opsgenie API error ${JSON.stringify(e)}`);
    }
  };

export const deleteSchedule =
  (config: ExpectedConfiguration) =>
  async (extractedUUID: string): Promise<DeleteResponse> => {
    try {
      const response = await fetch(
        `https://api.opsgenie.com/v2/schedules/${config.opsgenie_schedule_id}/rotations/${extractedUUID}`,
        {
          headers: {
            Authorization: `GenieKey ${config.opsgenie_api_key}`,
          },
          method: "DELETE",
        }
      );
      const data = await response.json();
      return {
        data,
        status: response.status,
      };
    } catch (e) {
      throw new Error(`Opsgenie API error ${JSON.stringify(e)}`);
    }
  };
