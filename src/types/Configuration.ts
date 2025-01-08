import { Context } from "effect";
import { ExpectedConfiguration } from "./ExpectedConfiguration";

export class Configuration extends Context.Tag("Configuration")<
  Configuration,
  ExpectedConfiguration
>() {}