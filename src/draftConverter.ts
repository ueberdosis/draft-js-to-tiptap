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
  createText,
  isInlineStyleRange,
  createNode,
  type DocumentType,
} from "./utils";
import {
  mapInlineStyleToMark,
  mapEntityToMark,
  mapEntityToNode,
  mapBlockToNode,
} from "./mappings";

type BlockMapContext = {
  /**
   * The entity map of the Draft.js content.
   */
  entityMap: RawDraftContentState["entityMap"];
  /**
   * The current document tree
   */
  doc: DocumentType;
  /**
   * The current block to convert.
   */
  getCurrentBlock: () => RawDraftContentBlock;
  /**
   * The current block to convert.
   */
  block: RawDraftContentBlock;
  /**
   * The index of the current block.
   */
  index: number;
  /**
   * Peeks at the next block in the content. Without iterating.
   * @returns The next block or null if there is no next block.
   */
  peek: () => RawDraftContentBlock | null;
  /**
   * Peeks at the previous block in the content. Without iterating.
   * @returns The previous block or null if there is no previous block.
   */
  peekPrev: () => RawDraftContentBlock | null;
  /**
   * Gets the next block in the content. Iterating forward.
   * @returns The next block or null if there is no next block.
   */
  next: () => RawDraftContentBlock | null;
  /**
   * Gets the previous block in the content. Iterating backward.
   * @returns The previous block or null if there is no previous block.
   */
  prev: () => RawDraftContentBlock | null;
};
/**
 * A function that maps a Draft.js block to a ProseMirror node.
 * @returns false if the block was not mapped, undefined if it was mapped
 */
export type MapBlockToNodeFn = (
  this: DraftConverter,
  context: BlockMapContext
) => NodeType | boolean | void | undefined;

/**
 * A function that maps a Draft.js inline style to a ProseMirror mark.
 */
export type MapInlineStyleToMarkFn = (
  this: DraftConverter,
  context: {
    range: RawDraftInlineStyleRange;
  }
) => MarkType | null;

/**
 * A function that maps a Draft.js entity to a ProseMirror mark.
 */
export type MapEntityToMarkFn = (
  this: DraftConverter,
  context: {
    range: RawDraftEntityRange;
    entityMap: RawDraftContentState["entityMap"];
  }
) => MarkType | null;

/**
 * A function that maps a Draft.js entity to a ProseMirror node.
 */
export type MapEntityToNodeFn = (
  this: DraftConverter,
  context: {
    range: RawDraftEntityRange;
    entityMap: RawDraftContentState["entityMap"];
  }
) => NodeType | null;

export type DraftConverterOptions = {
  mapBlockToNode: MapBlockToNodeFn;
  mapInlineStyleToMark: MapInlineStyleToMarkFn;
  mapEntityToMark: MapEntityToMarkFn;
  mapEntityToNode: MapEntityToNodeFn;
};

export class DraftConverter {
  /**
   * Any unmatched blocks, entities, or inline styles that were not converted.
   */
  public unmatched: {
    blocks: RawDraftContentBlock[];
    entities: { [key: string]: RawDraftEntity };
    inlineStyles: RawDraftInlineStyleRange[];
  } = {
    blocks: [],
    entities: {},
    inlineStyles: [],
  };
  public options: DraftConverterOptions;

  constructor(options?: Partial<DraftConverterOptions>) {
    this.options = {
      mapBlockToNode: mapBlockToNode,
      mapInlineStyleToMark: mapInlineStyleToMark,
      mapEntityToMark: mapEntityToMark,
      mapEntityToNode: mapEntityToNode,
      ...options,
    };
  }

  public createNode = createNode;
  public addChild = addChild;

  mapRangeToMark(
    range: RawDraftInlineStyleRange | RawDraftEntityRange,
    entityMap: RawDraftContentState["entityMap"]
  ): MarkType | null {
    if (isInlineStyleRange(range)) {
      try {
        const inlineStyle = this.options.mapInlineStyleToMark.bind(this)({
          range,
        });

        if (inlineStyle) {
          return inlineStyle;
        }
      } catch (e) {
        console.error(e);
      }

      this.unmatched.inlineStyles.push(range);
      return null;
    }

    try {
      const entity = this.options.mapEntityToMark.bind(this)({
        range,
        entityMap,
      });

      if (entity) {
        return entity;
      }
    } catch (e) {
      console.error(e);
    }

    this.unmatched.entities[range.key] = entityMap[range.key];
    return null;
  }

  mapBlockToNode: MapBlockToNodeFn = (options) => {
    let didConsume: boolean | NodeType = false;
    try {
      didConsume = this.options.mapBlockToNode.call(this, options) ?? false;
    } catch (e) {
      console.error(e);
    }

    if (didConsume === false) {
      this.unmatched.blocks.push(options.getCurrentBlock());
    }

    return didConsume;
  };

  mapEntityToNode: MapEntityToNodeFn = ({ range, entityMap }) => {
    try {
      const node = this.options.mapEntityToNode.bind(this)({
        range,
        entityMap,
      });
      if (node) {
        return node;
      }
    } catch (e) {
      console.error(e);
    }

    this.unmatched.entities[range.key] = entityMap[range.key];

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
      const textNode = createText(text);

      ranges.forEach((range) =>
        addMark(textNode, this.mapRangeToMark(range, options.entityMap))
      );

      return textNode;
    });
  }

  convert(draft: RawDraftContentState) {
    const doc = createDocument();
    let i = 0;
    const ctx = {
      get index() {
        return i;
      },
      get block() {
        return draft.blocks[i];
      },
      get doc() {
        return doc;
      },
      entityMap: draft.entityMap,
      peek: () => draft.blocks[i + 1] || null,
      peekPrev: () => draft.blocks[i - 1] || null,
      getCurrentBlock: () => draft.blocks[i],
      next: () => draft.blocks[i++] || null,
      prev: () => draft.blocks[i--] || null,
    };

    for (; i < draft.blocks.length; i++) {
      const mapped = this.mapBlockToNode.call(this, ctx);
      if (typeof mapped !== "boolean") {
        if (mapped) {
          this.addChild(doc, mapped);
        }
      }
    }

    return doc;
  }
}
