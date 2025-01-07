import { HttpRequest, InvocationContext } from "@azure/functions";
import { parseBody, readHeader } from "../utils/parseRequest";
import { runSlackApp } from "./app";
import { ExpectedConfiguration } from "../types/ExpectedConfiguration";

export const handler =
  (config: ExpectedConfiguration) =>
  async (request: HttpRequest, context: InvocationContext) => {
    context.log(`Running Service ${config.service_name}`);

    const body = await request.text();
    const contentType = readHeader(request, "content-type");
    const payload = parseBody(body, contentType);
    console.log(payload);

    if (payload && payload.challenge) {
      const { challenge } = payload;
      return {
        status: 200,
        body: JSON.stringify({
          challenge,
        }),
      };
    }

    runSlackApp(config)(payload);

    return {
      status: 202,
    };
  };
