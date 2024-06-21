import { DraftConverter } from "./src/index";

const draftContent = {
  blocks: [
    {
      key: "1",
      text: "Item 1",
      type: "unordered-list-item",
      depth: 0,
      inlineStyleRanges: [],
      entityRanges: [],
      data: {},
    },
    {
      key: "2",
      text: "Item 2",
      type: "unordered-list-item",
      depth: 0,
      inlineStyleRanges: [],
      entityRanges: [],
      data: {},
    },
  ],
  entityMap: {},
};

const convertDraftToTiptap = new DraftConverter({
  mapBlockToNode({ block, next, peek, converter, entityMap }) {
    if (block.type === "unordered-list-item") {
      // We need to check if the next block is also an unordered-list-item
      const listNode = converter.createNode("bulletList");
      do {
        const itemNode = converter.createNode("listItem", {
          content: [
            converter.createNode("paragraph", {
              content: [
                converter.splitTextByEntityRangesAndInlineStyleRanges({
                  block,
                  entityMap,
                }),
              ],
            }),
          ],
        });
        converter.addChild(listNode, itemNode);
        // The next item is not an unordered-list-item, so we break out of the loop
        if (peek()?.type !== "unordered-list-item") {
          break;
        }
        // `next` iterates to the next block
      } while (next());
      return listNode;
    }
  },
});

console.log(
  JSON.stringify(convertDraftToTiptap.convert(draftContent), null, 2)
);
