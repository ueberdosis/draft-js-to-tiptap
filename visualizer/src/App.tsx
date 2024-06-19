import "./styles.scss";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import SubScript from "@tiptap/extension-subscript";
import SuperScript from "@tiptap/extension-superscript";
import Underline from "@tiptap/extension-underline";
import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";

export default function Visualizer() {
  const [json, setJson] = useState<JSONContent | null>(null);
  const [value, setValue] = useState("");
  const editor = useEditor({
    content: `
        <p>
          Wow, this editor instance exports its content as JSON.
        </p>
      `,
    extensions: [
      StarterKit,
      SuperScript,
      SubScript,
      Link,
      Image,
      Underline,
      TextAlign,
      TextStyle,
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

  if (!editor) {
    return null;
  }

  return (
    <>
      <textarea
        onChange={(e) => {
          setValue(e.target.value);
          try {
            const jsonValue = JSON.parse(e.target.value);

            setJson(jsonValue);
            editor.commands.setContent(jsonValue);
          } catch (e) {
            // no-op
          }
        }}
        value={value}
      />
      <EditorContent editor={editor} />
      <div className="export">
        <h3>JSON Output</h3>
        <pre>
          <code>{JSON.stringify(json, null, 2)}</code>
        </pre>
      </div>
    </>
  );
}
