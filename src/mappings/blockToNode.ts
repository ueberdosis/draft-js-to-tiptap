import { addChild, createNode, createText, isListNode } from "../utils";
import type { MapBlockToNodeFn } from "../draftConverter";

/**
 * Lists are represented as a tree structure in ProseMirror.
 * Whereas in Draft.js they are represented as a flat list.
 * So, we need to build the tree structure for the list.
 */
const mapToListNode: MapBlockToNodeFn = function ({
  entityMap,
  getCurrentBlock,
  peek,
  next,
  converter,
}) {
  // Start a new list
  const outerListNode =
    getCurrentBlock().type === "unordered-list-item"
      ? createNode("bulletList")
      : createNode("orderedList");

  while (true) {
    let listNode = outerListNode;

    const currentBlock = getCurrentBlock();
    let depth = 0;
    while (depth < currentBlock.depth) {
      if (!listNode.content?.length) {
        listNode.content = [];
      }
      // There are list items in-between, find the most recent one
      let mostRecentListItem = listNode.content[listNode.content.length - 1];
      if (!mostRecentListItem) {
        mostRecentListItem = createNode("listItem");
        addChild(listNode, mostRecentListItem);
      }

      let nextMostRecentList =
        mostRecentListItem.content?.[mostRecentListItem.content.length - 1];

      if (isListNode(nextMostRecentList)) {
        // We found a list, move to the next one
        listNode = nextMostRecentList;

        depth++;
      } else {
        // We didn't find a list, in the last position, create a new one
        nextMostRecentList =
          currentBlock.type === "unordered-list-item"
            ? createNode("bulletList")
            : createNode("orderedList");

        addChild(mostRecentListItem, nextMostRecentList);

        listNode = nextMostRecentList;
        // Tiptap doesn't support nesting lists, so we break here
        break;
      }
    }

    // We found the correct list, add the new list item
    addChild(
      listNode,
      createNode("listItem", {
        content: [
          createNode("paragraph", {
            content: converter.splitTextByEntityRangesAndInlineStyleRanges({
              block: getCurrentBlock(),
              entityMap,
            }),
          }),
        ],
      })
    );

    const nextBlock = peek();
    if (
      !(
        (nextBlock && nextBlock.type === "unordered-list-item") ||
        (nextBlock && nextBlock.type === "ordered-list-item")
      )
    ) {
      break;
    }

    if (nextBlock && nextBlock.type !== currentBlock.type) {
      // We are switching between ordered and unordered lists
      break;
    }
    next();
  }

  return outerListNode;
};

const mapToHeadingNode: MapBlockToNodeFn = function ({
  block,
  entityMap,
  converter,
}) {
  const headingLevel = {
    "header-one": 1,
    "header-two": 2,
    "header-three": 3,
    "header-four": 4,
    "header-five": 5,
    "header-six": 6,
  }[block.type];

  return createNode("heading", {
    attrs: { level: headingLevel || 1 },
    content: converter.splitTextByEntityRangesAndInlineStyleRanges({
      block,
      entityMap,
    }),
  });
};

export const blockToNodeMapping: Record<string, MapBlockToNodeFn> = {
  atomic({ block, entityMap, converter }) {
    if (block.entityRanges.length === 0) {
      if (block.inlineStyleRanges.length === 0) {
        // Plain text, fast path
        return createText(block.text);
      }
    }
    // TODO atomic blocks use entities, to generate nodes
    // Does it make sense to wrap them in a paragraph?
    const paragraph = createNode("paragraph");
    const entities = block.entityRanges
      .map((range) => {
        return converter.mapEntityToNode({ range, entityMap, converter });
      })
      .filter(Boolean);

    if (entities.length === 0) {
      return false;
    }

    return addChild(paragraph, entities);
  },
  "code-block"({ block }) {
    return createNode("codeBlock", {
      content: [createText(block.text)],
    });
  },
  blockquote({ block, entityMap, converter }) {
    return createNode("blockquote", {
      content: [
        createNode("paragraph", {
          content: converter.splitTextByEntityRangesAndInlineStyleRanges({
            block,
            entityMap,
          }),
        }),
      ],
    });
  },
  unstyled({ block, entityMap, converter }) {
    const paragraph = createNode("paragraph");
    if (block.inlineStyleRanges.length === 0) {
      if (block.entityRanges.length === 0) {
        // Plain text, fast path
        return addChild(paragraph, createText(block.text));
      }
    }

    return addChild(
      paragraph,
      converter.splitTextByEntityRangesAndInlineStyleRanges({
        block,
        entityMap,
      })
    );
  },
  "unordered-list-item": mapToListNode,
  "ordered-list-item": mapToListNode,
  "header-one": mapToHeadingNode,
  "header-two": mapToHeadingNode,
  "header-three": mapToHeadingNode,
  "header-four": mapToHeadingNode,
  "header-five": mapToHeadingNode,
  "header-six": mapToHeadingNode,
};

export const mapBlockToNode: MapBlockToNodeFn = function (options) {
  const block = options.getCurrentBlock();
  if (blockToNodeMapping[block.type]) {
    return blockToNodeMapping[block.type](options);
  }

  return false;
};
