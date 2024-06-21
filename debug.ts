import { DraftConverter, type NodeType } from "./src/index";
import draft from "./test/draft-table-drafttail.json";

// You can add your own node types like this:
declare module "./src/index" {
  interface NodeMapping {
    // These will now be available to `createNode`, `addChild`, `addMark` functions
    test: NodeType<"test", { test: string }>;
  }
}
const converter = new DraftConverter();

const output = converter.convert(draft as any);

console.log(JSON.stringify(output, null, 2));

console.warn(JSON.stringify({ unmatched: converter.unmatched }, null, 2));
