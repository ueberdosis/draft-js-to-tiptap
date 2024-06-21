import type {
  RawDraftContentState,
  RawDraftContentBlock,
  RawDraftInlineStyleRange,
  RawDraftEntityRange,
  RawDraftEntity,
} from "draft-js";

import type {
  MapBlockToNodeFn,
  MapEntityToMarkFn,
  MapEntityToNodeFn,
  MapInlineStyleToMarkFn,
} from "./types";
import {
  addChild,
  addMark,
  createDocument,
  createNode,
  createText,
  isInlineStyleRange,
  type DocumentType,
  type MarkType,
  type NodeType,
  type TextType,
} from "./utils";
import {
  mapBlockToNode,
  mapEntityToMark,
  mapEntityToNode,
  mapInlineStyleToMark,
} from "./mappings";

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
  public createText = createText;
  public addMark = addMark;

  mapRangeToMark({
    range,
    entityMap,
    doc,
    block,
  }: {
    range: RawDraftInlineStyleRange | RawDraftEntityRange;
    entityMap: RawDraftContentState["entityMap"];
    doc: DocumentType;
    block: RawDraftContentBlock;
  }): MarkType | null {
    if (isInlineStyleRange(range)) {
      try {
        const inlineStyle =
          this.options.mapInlineStyleToMark({
            range,
            converter: this,
            doc,
            block,
          }) ?? null;

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
      const entity =
        this.options.mapEntityToMark({
          range,
          entityMap,
          converter: this,
          doc,
          block,
        }) ?? null;

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
    let didConsume: null | NodeType = null;
    try {
      didConsume = this.options.mapBlockToNode.call(this, options) ?? null;
    } catch (e) {
      console.error(e);
    }

    if (didConsume === null) {
      this.unmatched.blocks.push(options.getCurrentBlock());
    }

    return didConsume;
  };

  mapEntityToNode: MapEntityToNodeFn = ({ range, entityMap, doc, block }) => {
    try {
      const node = this.options.mapEntityToNode({
        range,
        entityMap,
        converter: this,
        doc,
        block,
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
    /**
     * The current document tree
     */
    doc: DocumentType;
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
        addMark(
          textNode,
          this.mapRangeToMark({
            range,
            entityMap: options.entityMap,
            doc: options.doc,
            block: options.block,
          })
        )
      );

      return textNode;
    });
  }

  convert(draft: RawDraftContentState) {
    // Reset unmatched blocks, entities, and inline styles on each conversion
    this.unmatched = {
      blocks: [],
      entities: {},
      inlineStyles: [],
    };

    const doc = createDocument();
    let i = 0;
    const ctx = {
      get index() {
        return i;
      },
      setIndex: (index: number) => {
        i = index;
      },
      get block() {
        return draft.blocks[i];
      },
      allBlocks: draft.blocks,
      get doc() {
        return doc;
      },
      entityMap: draft.entityMap,
      peek: () => draft.blocks[i + 1] || null,
      peekPrev: () => draft.blocks[i - 1] || null,
      getCurrentBlock: () => draft.blocks[i],
      next: () => draft.blocks[i++] || null,
      prev: () => draft.blocks[i--] || null,
      converter: this,
    } satisfies Parameters<MapBlockToNodeFn>[0];

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
