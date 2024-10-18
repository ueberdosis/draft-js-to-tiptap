import { expect, test } from "bun:test";
import { DraftConverter } from "../src/index";
import draftListSimple from "./draft-list-simple.json";
import draftList from "./draft-list.json";
import draftAxios from "./draft-axios.json";
import draftTail from "./draft-drafttail.json";
import draftTailTable from "./draft-table-drafttail.json";
import draftMediumComplex from "./draft-medium-complex.json";

test("draft-list-simple", () => {
  const converter = new DraftConverter();
  expect(converter.convert(draftListSimple)).toMatchSnapshot();
});

test("draft-list", () => {
  const converter = new DraftConverter();
  expect(converter.convert(draftList)).toMatchSnapshot();
});

test("draft-axios", () => {
  const converter = new DraftConverter();
  expect(converter.convert(draftAxios as any)).toMatchSnapshot();
});

test("draft-drafttail", () => {
  const converter = new DraftConverter();
  expect(converter.convert(draftTail as any)).toMatchSnapshot();
});

test("draft-table-drafttail", () => {
  const converter = new DraftConverter();
  expect(converter.convert(draftTailTable as any)).toMatchSnapshot();
});

test("draft-medium-complex", () => {
  const converter = new DraftConverter();
  expect(converter.convert(draftMediumComplex as any)).toMatchSnapshot();
});

test("draft-medium-complex", () => {
  const converter = new DraftConverter();
  expect(
    converter.convert({
      blocks: [
        {
          key: "a5rh8",
          text: "🕺🏽 Krewe of Boo hosts a jazz second-line through the French Quarter at 3pm, followed by happy hour at Pat O'Brien's. (Details)",
          type: "unstyled",
          depth: 0,
          inlineStyleRanges: [
            {
              style: "BOLD",
              length: 12,
              offset: 3,
            },
            {
              style: "ITALIC",
              length: 7,
              offset: 118,
            },
          ],
          entityRanges: [
            {
              offset: 118,
              length: 7,
              key: 0,
            },
          ],
          data: {},
        },
      ],
      // @ts-ignore
      entityMap: [
        {
          type: "LINK",
          mutability: "MUTABLE",
          data: {
            rel: "noreferrer",
            url: "https://www.kreweofboo.com/secondline",
            href: "https://www.kreweofboo.com/secondline",
            target: "_blank",
          },
        },
      ],
    })
  ).toEqual({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "🕺🏽 ",
            marks: [],
          },
          {
            type: "text",
            text: "Krewe of Boo",
            marks: [
              {
                type: "bold",
              },
            ],
          },
          {
            type: "text",
            text: " hosts a jazz second-line through the French Quarter at 3pm, followed by happy hour at Pat O'Brien's. (",
            marks: [],
          },
          {
            type: "text",
            text: "Details",
            marks: [
              {
                type: "link",
                attrs: {
                  href: "https://www.kreweofboo.com/secondline",
                  target: "_blank",
                },
              },
              {
                type: "italic",
              },
            ],
          },
          {
            type: "text",
            text: ")",
            marks: [],
          },
        ],
      },
    ],
  });
});
