import type { MapInlineStyleToMarkFn } from "../draftConverter";
import type { MarkType } from "../utils";

export const inlineStyleToMarkMapping: Record<string, MarkType> = {
  BOLD: { type: "bold" },
  CODE: { type: "code" },
  KEYBOARD: { type: "code" },
  ITALIC: { type: "italic" },
  STRIKETHROUGH: { type: "strike" },
  UNDERLINE: { type: "underline" },
  SUBSCRIPT: { type: "subscript" },
  SUPERSCRIPT: { type: "superscript" },
  HIGHLIGHT: { type: "highlight" },
};

export const mapInlineStyleToMark: MapInlineStyleToMarkFn = function ({
  range: { style },
}) {
  if (inlineStyleToMarkMapping[style]) {
    return inlineStyleToMarkMapping[style];
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
};
