import "./styles.scss";

import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import SubScript from "@tiptap/extension-subscript";
import SuperScript from "@tiptap/extension-superscript";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { useCallback, useEffect, useState } from "react";
import { JSONEntry } from "./JSONEntry";

export default function Visualizer() {
  const [mode, setMode] = useState<"json" | "preview">("json");
  const [json, setJson] = useState<JSONContent | undefined>(undefined);

  const editor = useEditor({
    extensions: [
      Placeholder.configure({
        placeholder:
          'Add content to the "Paste JSON" tab to see the preview here.',
      }),
      Highlight,
      Image,
      Link,
      StarterKit,
      SubScript,
      SuperScript,
      Table,
      TableCell,
      TableHeader,
      TableRow,
      TextAlign,
      TextStyle,
      Underline,
    ],
  });

  useEffect(() => {
    if (!editor) {
      return undefined;
    }

    // Get the initial content …
    setJson(editor.getJSON());

    // … and get the content after every change.
    editor.on("update", () => {
      setJson(editor.getJSON());
    });
  }, [editor]);

  const onChangeJSON = useCallback(
    (json: JSONContent) => {
      if (!editor) return;
      console.log("json", json);
      setJson(json);
      editor.commands.setContent(json);
    },
    [editor]
  );

  if (!editor) {
    return null;
  }

  return (
    <div>
      <div className="control-group">
        <div className="flex-row">
          <div className="switch-group">
            <label>
              <input
                type="radio"
                name="option-switch"
                onChange={() => setMode("json")}
                checked={mode === "json"}
              />
              Insert JSON
            </label>
            <label>
              <input
                type="radio"
                name="option-switch"
                onChange={() => setMode("preview")}
                checked={mode === "preview"}
              />
              Tiptap Editor Preview
            </label>
          </div>
          <div className="hint">
            {mode === "json"
              ? "💡 Parse Draft.js JSON into Tiptap by pasting into here."
              : "Previewing the JSON in the Tiptap editor"}
          </div>
        </div>
        <div
          className="flex-row"
          style={{ display: mode === "json" ? "block" : "none" }}
        >
          <JSONEntry editor={editor} onChange={onChangeJSON} />
        </div>
        <div
          className="flex-row"
          style={{ display: mode === "preview" ? "block" : "none" }}
        >
          <div className="flex-row">
            <div>
              <h3>Tiptap Preview</h3>
              <EditorContent editor={editor} />
            </div>
            <div className="export">
              <h3>Editor Parsed JSON</h3>
              <pre>
                <code>{JSON.stringify(json, null, 2)}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
