import { DraftConverter } from ".";
import draft from "./draft-drafttail.json";

const converter = new DraftConverter({
  mapBlockToNode: function ({ defaultRenderer, ...ctx }) {
    return defaultRenderer(ctx);
  },
});

const output = converter.convertFromDraft(draft as any);

console.log(JSON.stringify(output, null, 2));
console.warn(
  JSON.stringify(
    {
      unmatched: {
        blocks: converter.unmatchedBlocks,
        entities: converter.unmatchedEntities,
        inlineStyles: converter.unmatchedInlineStyles,
      },
    },
    null,
    2
  )
);
// // Same depth, add to the previous list
// if (previousBlock?.depth === block.depth) {
//   return addChild(previousNode, listItem);
// }

// // Deeper depth, create a new list
// if ((previousBlock?.depth || 0) < block.depth) {
//   const list =
//     block.type === "unordered-list-item"
//       ? createNode("bulletList")
//       : createNode("orderedList");

//   addChild(list, listItem);

//   // find the parent list
//   let listNode = previousNode;
//   let depth = 0;
//   while (listNode && depth < block.depth) {
//     listNode = listNode.content[listNode.content.length - 1];
//     depth++;
//   }
//   addChild(listNode, list);

//   return previousNode;
// }

// // Shallower depth, find the parent list
// if ((previousBlock?.depth || 0) > block.depth) {
//   // const list =
//   //   block.type === "unordered-list-item"
//   //     ? createNode("bulletList")
//   //     : createNode("orderedList");

//   // find the parent list
//   let listNode = previousNode;
//   let depth = 0;
//   while (listNode && depth < block.depth * 2) {
//     listNode = listNode.content[listNode.content.length - 1];
//     depth++;
//   }
//   addChild(listNode, listItem);

//   return previousNode;
// }

// // Already in a list, add the list item to the previous list
// return addChild(previousNode, listItem);
