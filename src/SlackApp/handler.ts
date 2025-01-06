import { HttpRequest, InvocationContext } from "@azure/functions";
import * as packageJson from "../../package.json";
import { parseBody, readHeader } from "./utils/parseRequest";
import { runSlackApp } from "./app";

export const handler = async (
  request: HttpRequest,
  context: InvocationContext
) => {
  context.log(`Starting Service`);

  if (request.method === "GET") {
    context.log(`Http request on GET for ${request.url}`);
    return {
      body: JSON.stringify({ data: `Hello World` }),
      status: 200,
    };
  } else if (request.method === "POST") {
    const body = await request.text();
    const contentType = readHeader(request, "content-type");
    const payload = parseBody(body, contentType);

    if (payload && payload.challenge) {
      const { challenge } = payload;
      return {
        status: 200,
        body: JSON.stringify({
          challenge,
        }),
      };
    }

    runSlackApp(payload);

    return {
      body: JSON.stringify({
        message: "Start App",
      }),
      status: 202,
    };
  } else {
    return {
      body: JSON.stringify({ error: `Method not allowed` }),
      status: 405,
    };
  }
};
