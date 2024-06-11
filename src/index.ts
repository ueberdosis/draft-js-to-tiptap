import type { MarkType, NodeType } from "./utils";

export * from "./draftConverter";
export * from "./mappings";
export * from "./utils";

export interface NodeMapping {
  // Doc is special, it's the root of the document.
  doc: NodeType<"doc", Record<string, any>, MarkType, NodeType[]>;
  // Text is special, it's the leaf node of the document.
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
}
