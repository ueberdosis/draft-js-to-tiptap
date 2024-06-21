import { expect, test, describe } from "bun:test";
import * as utils from "./utils";

describe("utils.createNode", () => {
  test("should create a node", () => {
    const node = utils.createNode("paragraph");
    expect(node).toEqual({ type: "paragraph" });
  });

  test("should create a node with content", () => {
    const node = utils.createNode("paragraph", { content: [] });
    expect(node).toEqual({ type: "paragraph", content: [] });
  });

  test("should create a node with attrs", () => {
    const node = utils.createNode("paragraph", { attrs: { x: 1 } });
    expect(node).toEqual({ type: "paragraph", attrs: { x: 1 } });
  });

  test("should create a node with marks", () => {
    const node = utils.createNode("paragraph", { marks: [] });
    expect(node).toEqual({ type: "paragraph", marks: [] });
  });
});

describe("utils.addChild", () => {
  test("should add child to a node", () => {
    const node = utils.createNode("paragraph");
    const child = utils.createText("Hello");
    utils.addChild(node, child);
    expect(node).toEqual({
      type: "paragraph",
      content: [{ type: "text", text: "Hello", marks: [] }],
    });
  });

  test("should add child to a node with content", () => {
    const node = utils.createNode("paragraph", { content: [] });
    const child = utils.createText("Hello");
    utils.addChild(node, child);
    expect(node).toEqual({
      type: "paragraph",
      content: [{ type: "text", text: "Hello", marks: [] }],
    });
  });

  test("should add multiple children to a node with content", () => {
    const node = utils.createNode("paragraph", { content: [] });
    const child = utils.createText("Hello");
    const anotherChild = utils.createText("World");
    utils.addChild(node, [child, anotherChild]);
    expect(node).toEqual({
      type: "paragraph",
      content: [
        { type: "text", text: "Hello", marks: [] },
        { type: "text", text: "World", marks: [] },
      ],
    });
  });
});

describe("utils.createDocument", () => {
  test("should create a document", () => {
    const doc = utils.createDocument();
    expect(doc).toEqual({ type: "doc", content: [] });
  });
});

describe("utils.createText", () => {
  test("should create a text node", () => {
    const text = utils.createText("Hello");
    expect(text).toEqual({ type: "text", text: "Hello", marks: [] });
  });

  test("should create a text node with marks", () => {
    const text = utils.createText("Hello", [{ type: "bold" }]);
    expect(text).toEqual({
      type: "text",
      text: "Hello",
      marks: [{ type: "bold" }],
    });
  });
});

describe("utils.addMark", () => {
  test("should add mark to a node", () => {
    const node = utils.createNode("paragraph");
    const mark = { type: "bold" };
    utils.addMark(node, mark);
    expect(node).toEqual({ type: "paragraph", marks: [{ type: "bold" }] });
  });

  test("should add mark to a node with marks", () => {
    const node = utils.createNode("paragraph", { marks: [] });
    const mark = { type: "bold" };
    utils.addMark(node, mark);
    expect(node).toEqual({ type: "paragraph", marks: [{ type: "bold" }] });
  });

  test("should add multiple marks to a node with marks", () => {
    const node = utils.createNode("paragraph", { marks: [] });
    const mark1 = { type: "bold" };
    const mark2 = { type: "italic" };
    utils.addMark(node, [mark1, mark2]);
    expect(node).toEqual({
      type: "paragraph",
      marks: [{ type: "bold" }, { type: "italic" }],
    });
  });
});

describe("utils.isInlineStyleRange", () => {
  test("should return true if range has style", () => {
    const range = { style: "BOLD" } as any;
    expect(utils.isInlineStyleRange(range)).toBe(true);
  });

  test("should return false if range does not have style", () => {
    const range = {} as any;
    expect(utils.isInlineStyleRange(range)).toBe(false);
  });
});

describe("utils.isEntityRange", () => {
  test("should return true if range has key", () => {
    const range = { key: 0 } as any;
    expect(utils.isEntityRange(range)).toBe(true);
  });

  test("should return false if range does not have key", () => {
    const range = {} as any;
    expect(utils.isEntityRange(range)).toBe(false);
  });
});
