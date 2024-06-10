import type {
  RawDraftContentState,
  RawDraftContentBlock,
  RawDraftInlineStyleRange,
  RawDraftEntityRange,
  RawDraftEntity,
} from "draft-js";

import {
  type MarkType,
  type NodeType,
  type TextType,
  addChild,
  addMark,
  createDocument,
} from "./utils";
import {
  entityToMark,
  entityToNode,
  inlineStyleToMark,
  mapBlockToNode,
} from "./mappings";

/**
 * A function that maps a Draft.js block to a ProseMirror node.
 */
export type MapBlockToNodeFn = (
  this: DraftConverter,
  context: {
    /**
     * The Draft.js block to render.
     */
    block: RawDraftContentBlock;
    /**
     * The entity map of the Draft.js content.
     */
    entityMap: RawDraftContentState["entityMap"];
    /**
     * The previous Node generated by the renderer.
     */
    previousNode: NodeType | null;
    /**
     * The previous block run through the renderer.
     */
    previousBlock: RawDraftContentBlock | null;
  }
) => NodeType | null;

/**
 * A function that maps a Draft.js inline style to a ProseMirror mark.
 */
export type MapInlineStyleToMarkFn = (
  this: DraftConverter,
  inlineStyleRange: RawDraftInlineStyleRange
) => MarkType | null;

/**
 * A function that maps a Draft.js entity to a ProseMirror mark.
 */
export type MapEntityToMarkFn = (
  this: DraftConverter,
  range: RawDraftEntityRange,
  entityMap: RawDraftContentState["entityMap"]
) => MarkType | null;

/**
 * A function that maps a Draft.js entity to a ProseMirror node.
 */
export type MapEntityToNodeFn = (
  this: DraftConverter,
  range: RawDraftEntityRange,
  entityMap: RawDraftContentState["entityMap"]
) => NodeType | null;

export type DraftConverterOptions = {
  mapBlockToNode: MapBlockToNodeFn;
  mapInlineStyleToMark: MapInlineStyleToMarkFn;
  mapEntityToMark: MapEntityToMarkFn;
  mapEntityToNode: MapEntityToNodeFn;
};

export class DraftConverter {
  public unmatchedBlocks: RawDraftContentBlock[] = [];
  public unmatchedEntities: { [key: string]: RawDraftEntity } = {};
  public unmatchedInlineStyles: RawDraftInlineStyleRange[] = [];
  public options: DraftConverterOptions;

  constructor(options?: Partial<DraftConverterOptions>) {
    this.options = {
      mapBlockToNode: this.defaultMapBlockToNode,
      mapInlineStyleToMark: this.defaultInlineStyleToMark,
      mapEntityToMark: this.defaultEntityToMark,
      mapEntityToNode: this.defaultEntityToNode,
      ...options,
    };
  }

  defaultInlineStyleToMark({ style }: { style: string }): MarkType | null {
    if (inlineStyleToMark[style]) {
      return inlineStyleToMark[style];
    }

    if (style.startsWith("bgcolor-")) {
      return {
        type: "highlight",
        attrs: {
          color: style.replace("bgcolor-", ""),
        },
      };
    }
    if (style.startsWith("fontfamily-")) {
      return {
        type: "textStyle",
        attrs: {
          fontFamily: style.replace("fontfamily-", ""),
        },
      };
    }
    return null;
  }

  defaultEntityToNode(
    { key }: RawDraftEntityRange,
    entityMap: RawDraftContentState["entityMap"]
  ): NodeType | null {
    if (entityToNode[entityMap[key].type]) {
      return entityToNode[entityMap[key].type](entityMap[key]);
    }

    return null;
  }

  defaultEntityToMark(
    { key }: RawDraftEntityRange,
    entityMap: RawDraftContentState["entityMap"]
  ): MarkType | null {
    if (entityToMark[entityMap[key].type]) {
      return entityToMark[entityMap[key].type](entityMap[key]);
    }

    return null;
  }

  defaultMapBlockToNode: MapBlockToNodeFn = ({
    block,
    entityMap,
    previousBlock,
    previousNode,
  }) => {
    if (mapBlockToNode[block.type]) {
      return mapBlockToNode[block.type].bind(this)({
        block,
        entityMap,
        previousBlock,
        previousNode,
      });
    }

    return null;
  };

  mapRangeToMark(
    range: RawDraftInlineStyleRange | RawDraftEntityRange,
    entityMap: RawDraftContentState["entityMap"]
  ): MarkType | null {
    if ("style" in range) {
      const inlineStyle = this.options.mapInlineStyleToMark.bind(this)(range);

      if (inlineStyle) {
        return inlineStyle;
      }

      this.unmatchedInlineStyles.push(range);
      return null;
    }

    const entity = this.options.mapEntityToMark.bind(this)(range, entityMap);

    if (entity) {
      return entity;
    }

    this.unmatchedEntities[range.key] = entityMap[range.key];
    return null;
  }

  mapBlockToNode: MapBlockToNodeFn = ({
    block,
    entityMap,
    previousBlock,
    previousNode,
  }) => {
    const node = this.options.mapBlockToNode.bind(this)({
      block,
      entityMap,
      previousBlock,
      previousNode,
    });
    if (node) {
      return node;
    }

    this.unmatchedBlocks.push(block);
    return null;
  };

  /**
   * This function splits a text into Nodes based on the entity ranges and inline style ranges.
   * Applying them as marks to the text. Which may overlap in their ranges.
   */
  splitTextByEntityRangesAndInlineStyleRanges(options: {
    /**
     * The Draft.js block to render.
     */
    block: RawDraftContentBlock;
    /**
     * The entity map of the Draft.js content.
     */
    entityMap: RawDraftContentState["entityMap"];
  }): TextType[] {
    const allRanges = [
      ...options.block.entityRanges,
      ...options.block.inlineStyleRanges,
    ].sort((a, b) => {
      // sort by range, then by length
      if (a.offset === b.offset) {
        return a.length - b.length;
      }
      return a.offset - b.offset;
    });

    let result: {
      text: string;
      ranges: (RawDraftEntityRange | RawDraftInlineStyleRange)[];
    }[] = [];
    let stylesAtPosition: {
      [key: number]: (RawDraftEntityRange | RawDraftInlineStyleRange)[];
    } = {};

    // Create a map of styles at each position
    for (let range of allRanges) {
      for (let i = range.offset; i < range.offset + range.length; i++) {
        if (!stylesAtPosition[i]) {
          stylesAtPosition[i] = [];
        }
        stylesAtPosition[i].push(range);
      }
    }

    // Split the text into groups by their range
    let currentRanges: (RawDraftEntityRange | RawDraftInlineStyleRange)[] = [];
    let currentText: string = "";
    for (let i = 0; i < options.block.text.length; i++) {
      let styles = stylesAtPosition[i] || [];
      if (
        styles.length !== currentRanges.length ||
        !styles.every((style) => currentRanges.includes(style))
      ) {
        if (currentText) {
          result.push({ text: currentText, ranges: currentRanges });
        }
        currentText = "";
        currentRanges = styles;
      }
      currentText += options.block.text[i];
    }

    if (currentText) {
      result.push({ text: currentText, ranges: currentRanges });
    }

    return result.map(({ text, ranges }) => {
      const textNode: TextType = { type: "text", text, marks: [] };

      ranges.forEach((range) =>
        addMark(textNode, this.mapRangeToMark(range, options.entityMap))
      );

      return textNode;
    });
  }

  convertFromDraft(draft: RawDraftContentState) {
    const doc = createDocument();

    let previousNode: NodeType | null = null;
    let previousBlock: RawDraftContentBlock | null = null;

    draft.blocks.forEach((block) => {
      const nextNode = this.mapBlockToNode({
        block,
        entityMap: draft.entityMap,
        previousNode,
        previousBlock,
      });

      if (nextNode) {
        // Skip adding the Node if it's the same as the previous one (e.g. a list item)
        if (nextNode !== previousNode) {
          addChild(doc, nextNode);
        }

        previousNode = nextNode;
      }
      previousBlock = block;
    });

    return doc;
  }
}
