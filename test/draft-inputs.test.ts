import { expect, test } from "bun:test";
import { DraftConverter } from "../src/index";
import draftListSimple from "./draft-list-simple.json";
import draftList from "./draft-list.json";
import draftAxios from "./draft-axios.json";
import draftTail from "./draft-drafttail.json";

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
