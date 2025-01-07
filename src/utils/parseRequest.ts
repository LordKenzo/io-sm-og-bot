import { HttpRequest } from "@azure/functions";
import { parse } from "querystring";
import { ContentTypeError, JsonError } from "./customErrors";
import { Effect } from "effect";

const jsonParse = (body: string): Effect.Effect<any, JsonError, never> =>
  Effect.try({
    try: () => JSON.parse(body),
    catch: () => new JsonError(),
  });

const isJson = (contentType: string | undefined) =>
  Effect.sync(() => {
    const extractedContentType = contentType;
    return extractedContentType === "application/json";
  });

const isXWWWForm = (contentType: string | undefined) =>
  Effect.sync(() => {
    const extractedContentType = contentType;
    return extractedContentType === "application/x-www-form-urlencoded";
  });

export const readHeader = (request: HttpRequest, key: string) =>
  Effect.succeed(Object.fromEntries(request.headers.entries())[key]);

export const parseBodyEffect = (
  stringBody: string | null,
  contentType: string | undefined
) => {
  return Effect.gen(function* () {
    const isJsonContentType = yield* isJson(contentType);

    if (isJsonContentType && stringBody) {
      return yield* jsonParse(stringBody);
    }
    const isXWWWFormContetType = yield* isXWWWForm(contentType);
    if (isXWWWFormContetType && stringBody) {
      const parsedBody = parse(stringBody);
      if (typeof parsedBody.payload === "string") {
        return jsonParse(parsedBody.payload);
      } else {
        return parsedBody;
      }
    }
    return yield* new ContentTypeError();
  });
};
