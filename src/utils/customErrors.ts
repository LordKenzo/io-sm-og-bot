import { Data } from "effect";

export class ContentTypeError extends Data.TaggedError("ContentTypeError")<
  Readonly<{}>
> {}

export class JsonError extends Data.TaggedError("JsonError")<Readonly<{}>> {}
