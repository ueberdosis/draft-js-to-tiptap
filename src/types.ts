import type {
  RawDraftContentState,
  RawDraftContentBlock,
  RawDraftInlineStyleRange,
  RawDraftEntityRange,
} from "draft-js";

import type { DraftConverter } from "./draftConverter";
import type { DocumentType, MarkType, NodeType } from "./utils";

/**
 * A function that maps a Draft.js block to a ProseMirror node.
 * @returns null if the block was not mapped, undefined if it was mapped
 */
export type MapBlockToNodeFn = (context: {
  /**
   * The draft converter instance.
   */
  converter: DraftConverter;
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
   * Sets the index of the current block.
   */
  setIndex: (index: number) => void;
  /**
   * All blocks in the content being converted.
   */
  allBlocks: RawDraftContentBlock[];
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
}) => NodeType | null | void | undefined;

/**
 * A function that maps a Draft.js inline style to a ProseMirror mark.
 */
export type MapInlineStyleToMarkFn = (context: {
  /**
   * The range of the inline style in the content.
   */
  range: RawDraftInlineStyleRange;
  /**
   * The draft converter instance.
   */
  converter: DraftConverter;
  /**
   * The current document tree
   */
  doc: DocumentType;
  /**
   * The current block being converted.
   */
  block: RawDraftContentBlock;
}) => MarkType | null | void | undefined;

/**
 * A function that maps a Draft.js entity to a ProseMirror mark.
 */
export type MapEntityToMarkFn = (context: {
  /**
   * The range of the entity in the content.
   */
  range: RawDraftEntityRange;
  /**
   * The entity map of the Draft.js content.
   */
  entityMap: RawDraftContentState["entityMap"];
  /**
   * The draft converter instance.
   */
  converter: DraftConverter;
  /**
   * The current document tree
   */
  doc: DocumentType;
  /**
   * The current block being converted.
   */
  block: RawDraftContentBlock;
}) => MarkType | null | void | undefined;

/**
 * A function that maps a Draft.js entity to a ProseMirror node.
 */
export type MapEntityToNodeFn = (context: {
  /**
   * The range of the entity in the content.
   */
  range: RawDraftEntityRange;
  /**
   * The entity map of the Draft.js content.
   */
  entityMap: RawDraftContentState["entityMap"];
  /**
   * The draft converter instance.
   */
  converter: DraftConverter;
  /**
   * The current document tree
   */
  doc: DocumentType;
  /**
   * The current block being converted.
   */
  block: RawDraftContentBlock;
}) => NodeType | null | void | undefined;
