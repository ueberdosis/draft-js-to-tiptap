import { addChild, createNode, createText, isListNode } from "../utils";
import type { MapBlockToNodeFn } from "../draftConverter";

/**
 * Lists are represented as a tree structure in ProseMirror.
 * Whereas in Draft.js they are represented as a flat list.
 * So, we need to build the tree structure for the list.
 */
const mapToListNode: MapBlockToNodeFn = function ({
  block,
  entityMap,
  previousNode,
  previousBlock,
}) {
  // First, we create the list item
  const listItem = createNode("listItem");
  const paragraph = createNode("paragraph");

  // And add the paragraph to the list item
  addChild(listItem, paragraph);

  // Then, we add the text to it's paragraph
  this.splitTextByEntityRangesAndInlineStyleRanges({
    block,
    entityMap,
  }).forEach((node) => {
    addChild(paragraph, node);
  });

  const startListNode =
    isListNode(previousNode) && previousBlock?.type === block.type
      ? previousNode
      : block.type === "unordered-list-item"
      ? createNode("bulletList")
      : createNode("orderedList");

  let listNode = startListNode;

  let depth = 0;
  while (depth < block.depth) {
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
        block.type === "unordered-list-item"
          ? createNode("bulletList")
          : createNode("orderedList");

      addChild(mostRecentListItem, nextMostRecentList);

      listNode = nextMostRecentList;
      // Tiptap doesn't support nesting lists, so we break here
      break;
    }
  }

  // We found the correct list, add the list item
  addChild(listNode, listItem);

  // Return the whole list structure (whether it was created or not)
  return startListNode;
};

const mapToHeadingNode: MapBlockToNodeFn = function ({ block, entityMap }) {
  const headingLevel = {
    "header-one": 1,
    "header-two": 2,
    "header-three": 3,
    "header-four": 4,
    "header-five": 5,
    "header-six": 6,
  }[block.type];
  const heading = createNode("heading", {
    attrs: { level: headingLevel || 1 },
  });

  this.splitTextByEntityRangesAndInlineStyleRanges({
    block,
    entityMap,
  }).forEach((node) => {
    addChild(heading, node);
  });

  return heading;
};

export const blockToNodeMapping: Record<string, MapBlockToNodeFn> = {
  atomic: function ({ block, entityMap }) {
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
        return this.mapEntityToNode.bind(this)({ range, entityMap });
      })
      .filter(Boolean);
    if (entities.length === 0) {
      return null;
    }
    entities.forEach((node) => {
      addChild(paragraph, node);
    });

    return paragraph;
  },
  "code-block": function ({ block }) {
    const codeBlock = createNode("codeBlock");
    const text = createText(block.text);
    addChild(codeBlock, text);

    return codeBlock;
  },
  blockquote: function ({ block, entityMap }) {
    const blockquote = createNode("blockquote");
    const paragraph = createNode("paragraph");

    this.splitTextByEntityRangesAndInlineStyleRanges({
      block,
      entityMap,
    }).forEach((node) => {
      addChild(paragraph, node);
    });

    return addChild(blockquote, paragraph);
  },
  unstyled: function ({ block, entityMap }) {
    const paragraph = createNode("paragraph");
    if (block.inlineStyleRanges.length === 0) {
      if (block.entityRanges.length === 0) {
        // Plain text, fast path
        return addChild(paragraph, createText(block.text));
      }
    }

    this.splitTextByEntityRangesAndInlineStyleRanges({
      block,
      entityMap,
    }).forEach((node) => {
      addChild(paragraph, node);
    });

    return paragraph;
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

export const mapBlockToNode: MapBlockToNodeFn = function ({
  block,
  entityMap,
  previousBlock,
  previousNode,
}) {
  if (blockToNodeMapping[block.type]) {
    return blockToNodeMapping[block.type].bind(this)({
      block,
      entityMap,
      previousBlock,
      previousNode,
    });
  }

  return null;
};
