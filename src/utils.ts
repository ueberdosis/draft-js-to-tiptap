import type { NodeMapping } from "./index";
import type {
  RawDraftContentState,
  RawDraftEntityRange,
  RawDraftInlineStyleRange,
} from "draft-js";

export type DraftJSContent = RawDraftContentState;
export type MarkType<
  Type extends string = string,
  Attributes extends Record<string, any> = Record<string, any>
> = {
  type: Type;
  attrs?: Attributes;
};

export type NodeType<
  TNodeType extends string = string,
  TNodeAttributes extends Record<string, any> = Record<string, any>,
  TMarkType extends MarkType = MarkType,
  TContentType extends NodeType[] = any
> = {
  type: TNodeType;
  attrs?: TNodeAttributes;
  content?: TContentType;
  marks?: TMarkType[];
};

export type DocumentType<
  TNodeAttributes extends Record<string, any> = Record<string, any>,
  TContentType extends NodeType[] = NodeType[]
> = NodeType<"doc", TNodeAttributes, never, TContentType>;

export type TextType<TMarkType extends MarkType = MarkType> = {
  type: "text";
  text: string;
  marks: TMarkType[];
};

/**
 * Add a child node to a parent node.
 * @returns The parent node with the child node added.
 */
export function addChild<TNodeType extends keyof NodeMapping>(
  node: NodeMapping[TNodeType],
  child:
    | NodeMapping[TNodeType]["content"][number][]
    | NodeMapping[TNodeType]["content"][number]
    | null
): NodeMapping[TNodeType] {
  if (!node && !child) {
    throw new Error("Cannot add a null child to a null parent.");
  }

  if (!child) {
    return node;
  }

  if (!node.content) {
    node.content = [];
  }

  if (Array.isArray(child)) {
    node.content.push.apply(node.content, child);
  } else {
    node.content.push(child);
  }

  return node;
}

/**
 * Add a mark to a node.
 * @returns The node with the mark added.
 */
export function addMark<TNodeType extends keyof NodeMapping>(
  node: NodeMapping[TNodeType],
  mark:
    | NonNullable<NodeMapping[TNodeType]["marks"]>
    | NonNullable<NodeMapping[TNodeType]["marks"]>[number]
    | null
): NodeMapping[TNodeType] {
  if (!node && !mark) {
    throw new Error("Cannot add a null mark to a null node.");
  }

  if (!mark) {
    return node;
  }

  if (!node.marks) {
    node.marks = [];
  }

  if (Array.isArray(mark)) {
    node.marks.push.apply(node.marks, mark);
  } else {
    node.marks.push(mark);
  }

  return node;
}

/**
 * Create a ProseMirror node.
 * @param type The type of the node.
 * @param options Additional options for the node.
 */
export function createNode<TNodeType extends keyof NodeMapping>(
  type: TNodeType,
  options?: Partial<Omit<NodeMapping[TNodeType], "type">>
): NodeMapping[TNodeType] {
  return { type, ...options } as NodeMapping[TNodeType];
}

/**
 * Create a ProseMirror document.
 * @returns The document node.
 */
export function createDocument(): DocumentType {
  return { type: "doc", content: [] };
}

/**
 * Create a ProseMirror text node.
 * @param text The text content of the node.
 * @param marks The marks to apply to the text node.
 * @returns The text node.
 */
export function createText(text: string, marks?: MarkType[]): TextType {
  return { type: "text", text, marks: marks || [] };
}

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
 * Check if a node is a document node.
 * @param node The node to check.
 * @returns `true` if the node is a document node, `false` otherwise.
 */
export function isDocument(node: unknown): node is DocumentType {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    node.type === "doc"
  );
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

/**
 * Check if a node is a text node.
 * @param node The node to check.
 * @returns `true` if the node is a text node, `false` otherwise.
 */
export function isText(node: unknown): node is TextType {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    node.type === "text"
  );
}

/**
 * Check if a node is a node.
 * @param node The node to check.
 * @returns `true` if the node is a node, `false` otherwise.
 */
export function isNode(node: unknown): node is NodeType {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    node.type !== "text"
  );
}
