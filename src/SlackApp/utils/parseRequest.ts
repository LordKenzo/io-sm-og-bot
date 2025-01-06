import { HttpRequest } from "@azure/functions";
import { parse } from "querystring";

export const readHeader = (request: HttpRequest, key: string) =>
  Object.fromEntries(request.headers.entries())[key];

export const parseBody = (
  stringBody: string | null,
  contentType: string | undefined
) => {
  try {
    if (!stringBody) {
      return "";
    }

    let result = {};

    if (contentType && contentType === "application/json") {
      return JSON.parse(stringBody);
    }

    if (contentType && contentType === "application/x-www-form-urlencoded") {
      const parsedBody = parse(stringBody);
      if (typeof parsedBody.payload === "string") {
        return JSON.parse(parsedBody.payload);
      }

      return parsedBody;
    }

    // TO-DO: implement result
    return result;
  } catch {
    return "";
  }
};
