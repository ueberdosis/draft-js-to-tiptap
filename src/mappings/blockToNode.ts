import { addChild, createNode, createText, isListNode } from "../utils";
import type { MapBlockToNodeFn } from "../draftConverter";
import type { RawDraftContentBlock } from "draft-js";

/**
 * Lists are represented as a tree structure in ProseMirror.
 * Whereas in Draft.js they are represented as a flat list.
 * So, we need to build the tree structure for the list.
 */
const mapToListNode: MapBlockToNodeFn = function ({
  get,
  prev,
  next,
  entityMap,
  addToDoc,
}) {
  // Start a new list
  const startListNode =
    get().type === "unordered-list-item"
      ? createNode("bulletList")
      : createNode("orderedList");

  const createListItem = () => {
    // Create a paragraph with all the text
    const paragraph = createNode("paragraph");

    // Then, we add the text to it's paragraph
    this.splitTextByEntityRangesAndInlineStyleRanges({
      block: get(),
      entityMap,
    }).forEach((node) => {
      addChild(paragraph, node);
    });

    const listItem = createNode("listItem");
    // And add the paragraph to the list item
    addChild(listItem, paragraph);

    return listItem;
  };

  // TODO need to account switching between ordered and unordered lists
  do {
    let listNode = startListNode;

    const block = get();
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
    addChild(listNode, createListItem());

    next();
  } while (
    get()?.type === "unordered-list-item" ||
    get()?.type === "ordered-list-item"
  );

  // Could also peek ahead but this is simpler
  // Go back to the last block since we went too far
  prev();

  addToDoc(startListNode);
};

const mapToHeadingNode: MapBlockToNodeFn = function ({
  get,
  addToDoc,
  entityMap,
}) {
  const block = get();

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

  addToDoc(heading);
};

export const blockToNodeMapping: Record<string, MapBlockToNodeFn> = {
  atomic: function ({ get, addToDoc, entityMap }) {
    const block = get();
    if (block.entityRanges.length === 0) {
      if (block.inlineStyleRanges.length === 0) {
        // Plain text, fast path
        addToDoc(createText(block.text));
        return;
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
      return false;
    }
    entities.forEach((node) => {
      addChild(paragraph, node);
    });

    addToDoc(paragraph);
  },
  "code-block": function ({ get, addToDoc }) {
    const block = get();
    const codeBlock = createNode("codeBlock");
    const text = createText(block.text);
    addChild(codeBlock, text);
    addToDoc(codeBlock);
  },
  blockquote: function ({ get, entityMap, addToDoc }) {
    const block = get();
    const blockquote = createNode("blockquote");
    const paragraph = createNode("paragraph");

    this.splitTextByEntityRangesAndInlineStyleRanges({
      block,
      entityMap,
    }).forEach((node) => {
      addChild(paragraph, node);
    });
    addChild(blockquote, paragraph);
    addToDoc(blockquote);
  },
  unstyled: function ({ get, entityMap, addToDoc }) {
    const block = get();
    const paragraph = createNode("paragraph");
    if (block.inlineStyleRanges.length === 0) {
      if (block.entityRanges.length === 0) {
        // Plain text, fast path
        addChild(paragraph, createText(block.text));
        addToDoc(paragraph);
        return;
      }
    }

    this.splitTextByEntityRangesAndInlineStyleRanges({
      block,
      entityMap,
    }).forEach((node) => {
      addChild(paragraph, node);
    });
    addToDoc(paragraph);
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
  const block = options.get();
  if (blockToNodeMapping[block.type]) {
    return blockToNodeMapping[block.type].bind(this)(options);
  }

  return false;
};
