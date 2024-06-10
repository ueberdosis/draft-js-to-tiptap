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

export type NodeMapping = {
  blockquote: NodeType<"blockquote">;
  bulletList: NodeType<
    "bulletList",
    Record<string, any>,
    MarkType,
    NodeMapping["listItem"][]
  >;
  codeBlock: NodeType<"codeBlock">;
  hardBreak: NodeType<"hardBreak">;
  heading: NodeType<"heading", { level: number }>;
  horizontalRule: NodeType<"horizontalRule">;
  image: NodeType<"image", { src: string }>;
  listItem: NodeType<
    "listItem",
    Record<string, any>,
    MarkType,
    (NodeType<"bulletList"> | NodeType<"orderedList"> | NodeType<"paragraph">)[]
  >;
  orderedList: NodeType<
    "orderedList",
    Record<string, any>,
    MarkType,
    NodeMapping["listItem"][]
  >;
  paragraph: NodeType<"paragraph">;
};

/**
 * Add a child node to a parent node.
 * @returns The parent node with the child node added.
 */
export function addChild<T extends NodeType>(
  node: T,
  child: T["content"][number] | null
): T {
  if (!node && !child) {
    throw new Error("Cannot add a null child to a null parent.");
  }

  if (!child) {
    return node;
  }

  if (!node.content) {
    node.content = [];
  }

  node.content.push(child);

  return node;
}

/**
 * Add a mark to a node.
 * @returns The node with the mark added.
 */
export function addMark<T extends NodeType>(node: T, mark: MarkType | null): T {
  if (!node && !mark) {
    throw new Error("Cannot add a null mark to a null node.");
  }

  if (!mark) {
    return node;
  }

  if (!node.marks) {
    node.marks = [];
  }

  node.marks.push(mark);

  return node;
}

// export function createNode<T extends string>(type: T): NodeType<T>;
export function createNode<T extends keyof NodeMapping>(
  type: T,
  options?: Partial<Omit<NodeMapping[T], "type">>
): NodeMapping[T] {
  return { type, ...options } as NodeMapping[T];
}

export function createDocument(): DocumentType {
  return { type: "doc", content: [] };
}

export function createText(text: string, marks?: MarkType[]): TextType {
  return { type: "text", text, marks: marks || [] };
}

export function isListNode(
  node: NodeType | null | undefined
): node is NodeMapping["bulletList"] | NodeMapping["orderedList"] {
  return Boolean(
    node && (node.type === "bulletList" || node.type === "orderedList")
  );
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
