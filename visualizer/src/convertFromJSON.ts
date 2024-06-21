import {
  type DraftJSContent,
  DraftConverter,
  mapBlockToNode,
  mapEntityToMark,
  mapEntityToNode,
  mapInlineStyleToMark,
  createNode,
  addChild,
  createText,
} from "../../src/index";

/**
 * Use this to test out your custom mappings.
 * This function is called by the JSONEntry component in the visualizer.
 * So, you can test your custom mappings by pasting Draft.js JSON into the JSONEntry component.
 */
export function convertFromJSON(json: DraftJSContent) {
  const converter = new DraftConverter({
    /**
     * You have full control on how to map a Draft.js block to a ProseMirror node.
     * @returns null if the block was not mapped, undefined or the new node if it was mapped
     */
    mapBlockToNode(context) {
      // Use the default mapping for Draft.js built-in block types
      const defaultMapping = mapBlockToNode(context);
      if (defaultMapping) {
        return defaultMapping;
      }
      // Often, Draft.js content contains custom block types that are not built-in.

      // You can handle them here.
      switch (context.block.type) {
        // This is just showing that you can create a Tiptap mapping for a custom block type
        case "special-demo-block": {
          // The `.converter` object has helper functions to create Tiptap nodes
          return addChild(
            createNode("paragraph"),
            createText(context.block.text)
          );
          // Ends up looking like this in the Tiptap editor: `<p>${block.text}</p>`
        }
      }

      // If nothing was matched, return null to add to the unmatched.blocks list
      return null;
    },
    /**
     * You have full control on how to map a Draft.js entity to a ProseMirror mark.
     * @returns null if the entity was not mapped, undefined or the new mark if it was mapped
     */
    mapEntityToMark(context) {
      const defaultMapping = mapEntityToMark(context);
      if (defaultMapping) {
        return defaultMapping;
      }
      return null;
    },
    /**
     * You have full control on how to map a Draft.js entity to a ProseMirror node.
     * @returns null if the entity was not mapped, undefined or the new node if it was mapped
     */
    mapEntityToNode(context) {
      // Sometimes, you may want to map an entity to a node instead of a mark.
      const defaultMapping = mapEntityToNode(context);
      if (defaultMapping) {
        return defaultMapping;
      }
      return null;
    },
    /**
     * You have full control on how to map a Draft.js inline style to a ProseMirror mark.
     * @returns null if the inline style was not mapped, undefined or the new mark if it was mapped
     */
    mapInlineStyleToMark(context) {
      const defaultMapping = mapInlineStyleToMark(context);
      if (defaultMapping) {
        return defaultMapping;
      }
      return null;
    },
  });

  const document = converter.convert(json);
  return {
    document: document,
    unmatched: converter.unmatched,
  };
}
