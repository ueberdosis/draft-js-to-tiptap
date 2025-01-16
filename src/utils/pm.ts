export interface MarkMapping {
  bold: MarkType<"bold">;
  code: MarkType<"code">;
  italic: MarkType<"italic">;
  strike: MarkType<"strike">;
  underline: MarkType<"underline">;
  subscript: MarkType<"subscript">;
  superscript: MarkType<"superscript">;
  highlight: MarkType<"highlight", { color: string }>;
  link: MarkType<"link", { href: string; target: string }>;
  textStyle: MarkType<"textStyle", { fontFamily?: string; color?: string }>;
}

export interface NodeMapping {
  /**
   * Doc is special, it's the root of the document
   */
  doc: NodeType<"doc", Record<string, any>, MarkType, NodeType[]>;
  /**
   * Text is special, it's the leaf node of the document
   */
  text: NodeType<"text", Record<string, any>, MarkType, never>;
  // All other node types are defined here.
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
  image: NodeType<"image", { src: string; alt?: string }>;
  listItem: NodeType<
    "listItem",
    Record<string, any>,
    MarkType,
    (NodeType<"bulletList"> | NodeType<"orderedList"> | NodeType<"paragraph">)[]
  >;
  orderedList: NodeType<
    "orderedList",
    {
      type?: "1" | "a" | "A" | "i" | "I";
      start?: number;
    },
    MarkType,
    NodeMapping["listItem"][]
  >;
  paragraph: NodeType<"paragraph">;
  tableCell: NodeType<
    "tableCell",
    {
      colwidth?: number[];
      colspan?: number;
      rowspan?: number;
    },
    MarkType,
    NodeType[]
  >;
  tableHeader: NodeType<
    "tableCell",
    {
      colwidth?: number[];
      colspan?: number;
      rowspan?: number;
    },
    MarkType,
    NodeType[]
  >;
  tableRow: NodeType<
    "tableRow",
    Record<string, any>,
    MarkType,
    NodeMapping["tableCell"][]
  >;
  table: NodeType<
    "table",
    Record<string, any>,
    MarkType,
    NodeMapping["tableRow"][]
  >;
  // Custom node types that are not real yet
  pageBreak: NodeType<"pageBreak">;
}

export type MarkType<
  Type extends string = string,
  Attributes extends Record<string, any> = Record<string, any>
> = {
  type: Type;
  attrs?: Attributes & Record<string, any>;
};

export type NodeType<
  TNodeType extends string = string,
  TNodeAttributes extends Record<string, any> = Record<string, any>,
  TMarkType extends MarkType = MarkType,
  TContentType extends NodeType[] = any
> = {
  type: TNodeType;
  attrs?: TNodeAttributes & Record<string, any>;
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
    node.marks.push.apply(node.marks, mark.filter(Boolean));
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
 * Create a ProseMirror mark.
 * @param type The type of the mark.
 * @param options Additional options for the mark.
 */
export function createMark<TMarkType extends keyof MarkMapping>(
  type: TMarkType,
  options?: Partial<Omit<MarkMapping[TMarkType], "type">>
): MarkMapping[TMarkType] {
  return { type, ...options } as MarkMapping[TMarkType];
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
