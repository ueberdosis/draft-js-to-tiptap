import { DraftConverter } from "./src/index";
import draft from "./test/draft-complex.json";

const converter = new DraftConverter();

const output = converter.convert(draft as any);

console.log(JSON.stringify(output, null, 2));

console.warn(JSON.stringify({ unmatched: converter.unmatched }, null, 2));
