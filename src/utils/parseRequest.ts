import { HttpRequest } from "@azure/functions";
import { parse } from "querystring";
import { ContentTypeError, JsonError } from "./customErrors";
import { Effect, pipe } from "effect";

const parseJson = (body: string) =>
  Effect.try({
    try: () => JSON.parse(body),
    catch: () => new JsonError(),
  });

const isContentType = (contentType: string | undefined, expected: string) =>
  Effect.sync(() => contentType === expected);

const readHeader = (request: HttpRequest, key: string) =>
  Effect.succeed(request.headers.get(key) || undefined);

const parseBody = (body: string | null, contentType: string | undefined) =>
  pipe(
    Effect.gen(function* () {
      if (yield* isContentType(contentType, "application/json")) {
        if (body) {
          return yield* parseJson(body);
        }
        return yield* Effect.fail(new JsonError());
      }

      if (
        yield* isContentType(contentType, "application/x-www-form-urlencoded")
      ) {
        if (body) {
          const parsedBody = parse(body);
          if (typeof parsedBody.payload === "string") {
            return yield* parseJson(parsedBody.payload);
          }
          return parsedBody;
        }
        return yield* Effect.fail(new JsonError());
      }

      return yield* Effect.fail(new ContentTypeError());
    })
  );

export const parseRequest = (request: HttpRequest) =>
  pipe(
    Effect.tryPromise(() => request.text()),
    Effect.flatMap((body) =>
      pipe(
        readHeader(request, "content-type"),
        Effect.flatMap((contentType) => parseBody(body, contentType))
      )
    )
  );
