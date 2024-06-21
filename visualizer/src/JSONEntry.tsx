import { Editor, JSONContent, createNodeFromContent } from "@tiptap/react";
import { useEffect, useState } from "react";

import { DraftConverter, isDocument, isDraftJSContent } from "../../src/index";
import { convertFromJSON } from "./convertFromJson";

export function JSONEntry({
  editor,
  onChange,
}: {
  editor: Editor;
  onChange: (json: JSONContent) => void;
}) {
  const [unmatched, setUnmatched] = useState<DraftConverter["unmatched"]>({
    blocks: [],
    entities: {},
    inlineStyles: [],
  });
  const [converted, setConverted] = useState<JSONContent | undefined>(
    undefined
  );
  const [draftJsText, setDraftJsText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    try {
      let draftJsJSONValue = JSON.parse(draftJsText);

      if (isDraftJSContent(draftJsJSONValue)) {
        // Not already a tiptap document, so convert it.
        const { document, unmatched } = convertFromJSON(draftJsJSONValue);
        draftJsJSONValue = document;
        setUnmatched(unmatched);
      } else if (isDocument(draftJsJSONValue)) {
        // Already a tiptap document, so just set it.
        setUnmatched({
          blocks: [],
          entities: {},
          inlineStyles: [],
        });
      }

      setConverted(draftJsJSONValue);
      // This sends the JSON to the editor, even if it's invalid to the schema.
      onChange(draftJsJSONValue);
      try {
        createNodeFromContent(draftJsJSONValue, editor.schema, {
          errorOnInvalidContent: true,
        });
        setErrorMessage(undefined);
      } catch (e) {
        if (e instanceof Error && e.cause instanceof Error) {
          setErrorMessage(e.cause.message);
        }
      }
    } catch (e) {
      // no-op
    }
  }, [draftJsText, editor.schema, onChange]);

  return (
    <>
      {errorMessage && <div className="hint error">{errorMessage}</div>}
      <textarea
        className="json-input"
        onChange={(e) => setDraftJsText(e.target.value)}
        value={draftJsText}
        rows={10}
        placeholder="Paste Draft.js OR Tiptap JSON into here"
      />
      {converted ? (
        <div className="flex-row">
          <div className="preview-conversion">
            <h2>Preview conversion</h2>
            <div className="output-group">
              <pre>
                <code>{JSON.stringify(converted, null, 2)}</code>
              </pre>
            </div>
          </div>
          <div className="unmatched">
            <h2>Unmatched Content</h2>
            <div className="output-group">
              {["blocks", "entities", "inlineStyles"].map((key) => {
                const value = unmatched[key as keyof typeof unmatched];

                if (
                  (Array.isArray(value) && value.length === 0) ||
                  (typeof value === "object" && Object.keys(value).length === 0)
                ) {
                  return (
                    <div className="hint" key={key}>
                      All {key} matched
                    </div>
                  );
                }

                return (
                  <div key={key}>
                    <h2>{key}</h2>
                    <pre>
                      <code>{JSON.stringify(value, null, 2)}</code>
                    </pre>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <>
          <button
            onClick={() =>
              setDraftJsText(`{
  "entityMap": {},
  "blocks": [
    {
      "key": "14ddo",
      "text": "Level 1",
      "type": "unordered-list-item",
      "depth": 0,
      "inlineStyleRanges": [],
      "entityRanges": [],
      "data": {}
    },
    {
      "key": "59gth",
      "text": "Level 1 bullet 2",
      "type": "unordered-list-item",
      "depth": 0,
      "inlineStyleRanges": [],
      "entityRanges": [],
      "data": {}
    },
    {
      "key": "59bth",
      "text": "Level 1 bullet 3",
      "type": "unordered-list-item",
      "depth": 0,
      "inlineStyleRanges": [],
      "entityRanges": [],
      "data": {}
    },
    {
      "key": "59bth",
      "text": "Not a Draft.js built-in block type",
      "type": "special-demo-block",
      "depth": 0,
      "inlineStyleRanges": [],
      "entityRanges": [],
      "data": {}
    }
  ]
}`)
            }
          >
            Use Test file
          </button>
        </>
      )}
    </>
  );
}
