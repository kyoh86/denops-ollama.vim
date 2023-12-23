import { is } from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";

// The format to return a response in. Currently the only accepted value is json
export const isFormat = is.OptionalOf(is.LiteralOf("json"));
