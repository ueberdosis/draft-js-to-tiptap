import type {
  RawDraftContentState,
  RawDraftEntityRange,
  RawDraftInlineStyleRange,
} from "draft-js";

export type DraftJSContent = RawDraftContentState;

/**
 * Check if a range is an inline style range.
 * @param range The range to check.
 * @returns `true` if the range is an inline style range, `false` otherwise.
 */
export function isInlineStyleRange(
  range: RawDraftInlineStyleRange | RawDraftEntityRange
): range is RawDraftInlineStyleRange {
  return "style" in range;
}

/**
 * Check if a range is an entity range.
 * @param range The range to check.
 * @returns `true` if the range is an entity range, `false` otherwise.
 */
export function isEntityRange(
  range: RawDraftInlineStyleRange | RawDraftEntityRange
): range is RawDraftEntityRange {
  return "key" in range;
}

/**
 * Check if a node is a text node.
 * @param node The node to check.
 * @returns `true` if the node is a text node, `false` otherwise.
 */
export function isDraftJSContent(node: unknown): node is DraftJSContent {
  return (
    typeof node === "object" &&
    node !== null &&
    "blocks" in node &&
    "entityMap" in node
  );
}
