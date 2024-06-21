import type { NodeMapping } from "./index";
import type { RawDraftEntityRange, RawDraftInlineStyleRange } from "draft-js";

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

export function createNode<TNodeType extends keyof NodeMapping>(
  type: TNodeType,
  options?: Partial<Omit<NodeMapping[TNodeType], "type">>
): NodeMapping[TNodeType] {
  return { type, ...options } as NodeMapping[TNodeType];
}

export function createDocument(): DocumentType {
  return { type: "doc", content: [] };
}

export function createText(text: string, marks?: MarkType[]): TextType {
  return { type: "text", text, marks: marks || [] };
}

export function isInlineStyleRange(
  range: RawDraftInlineStyleRange | RawDraftEntityRange
): range is RawDraftInlineStyleRange {
  return "style" in range;
}

export function isEntityRange(
  range: RawDraftInlineStyleRange | RawDraftEntityRange
): range is RawDraftEntityRange {
  return "key" in range;
}
