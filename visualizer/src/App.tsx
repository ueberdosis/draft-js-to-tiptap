import "./styles.scss";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import SubScript from "@tiptap/extension-subscript";
import SuperScript from "@tiptap/extension-superscript";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useState } from "react";

export default function Visualizer() {
  const [json, setJson] = useState(null);
  const [value, setValue] = useState("");
  const editor = useEditor({
    content: `
        <p>
          Wow, this editor instance exports its content as JSON.
        </p>
      `,
    extensions: [StarterKit, SuperScript, SubScript, Link, Image, Underline],
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

  const setContent = useCallback(() => {
    // You can pass a JSON document to the editor.
    editor.commands.setContent(
      {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "It’s 19871. You can’t turn on a radio, or go to a mall without hearing Olivia Newton-John’s hit song, Physical.",
              },
            ],
          },
        ],
      },
      true
    );

    // It’s likely that you’d like to focus the Editor after most commands.
    editor.commands.focus();
  }, [editor]);

  const clearContent = useCallback(() => {
    editor.chain().clearContent(true).focus().run();
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
