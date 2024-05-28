export type MarkType = {
  type: string;
  attrs?: Record<string, any>;
};

export type TextType = {
  type: "text";
  text: string;
  marks?: MarkType[];
};

export type AnyJSONContent = {
  type: string;
  attrs?: Record<string, any>;
  content?: JSONContent[];
  marks?: MarkType[];
};

export type JSONContent = TextType | AnyJSONContent;

export type DocumentType = {
  type: string;
  content: JSONContent[];
};

export type DefaultContext = {
  parentNode?: Node;
};

export class Node {
  public type: string;
  public attrs?: Record<string, any>;
  public content?: Node[];
  public marks?: Mark[];
  public text?: string;

  constructor({
    type,
    attrs,
    content,
    marks,
    text,
  }: {
    type: string;
    attrs?: Record<string, any>;
    content?: Node[] | JSONContent[];
    marks?: Mark[] | MarkType[];
    text?: string;
  }) {
    this.type = type;
    this.attrs = attrs;
    if (content && Array.isArray(content)) {
      this.content = content.map((node) => {
        if (node instanceof Node) {
          return node;
        }
        return new Node(node);
      });
    }
    if (marks && Array.isArray(marks)) {
      this.marks = marks.map((mark) => {
        if (mark instanceof Mark) {
          return mark;
        }
        return new Mark(mark);
      });
    }
    this.text = text;
  }

  /**
   * Adds a mark to the node.
   * @param mark The mark to add.
   */
  addMark(mark: Mark | MarkType | null) {
    if (!mark) {
      return this;
    }

    if (!this.marks) {
      this.marks = [];
    }
    if (mark instanceof Mark) {
      this.marks.push(mark);
    } else {
      this.marks.push(new Mark(mark));
    }
    return this;
  }

  /**
   * Adds a node to the content of the node.
   * @param node The node to add.
   */
  addNode(node: Node | null) {
    if (!node) {
      return this;
    }
    if (!this.content) {
      this.content = [];
    }
    this.content.push(node);
    return this;
  }

  /**
   * Inserts an node at a specific index in the content of the node.
   * @param node The node to insert.
   * @param index The index at which to insert the node.
   */
  insertNode(node: Node | null, index?: number) {
    if (!node) {
      return this;
    }
    if (!this.content) {
      this.content = [];
    }
    if (index === undefined) {
      return this.addNode(node);
    }
    this.content.splice(index, 0, node);
    return this;
  }

  /**
   * Removes an node from the content of the node.
   * @param index The index of the node to remove.
   */
  removeNode(index: number) {
    if (this.content && this.content.length > index) {
      this.content.splice(index, 1);
    }
    return this;
  }

  /**
   * Sets the attributes of the node.
   * @param attrs The attributes to set.
   */
  setAttributes(attrs: AnyJSONContent["attrs"]) {
    this.attrs = { ...this.attrs, ...attrs };
    return this;
  }

  /**
   * Adds an attribute to the node.
   * @param name The key of the attribute to add.
   * @param value The value of the attribute to add.
   */
  addAttribute(name: string, value: any) {
    this.attrs = {
      ...this.attrs,
      [name]: value,
    };
    return this;
  }

  /**
   * Removes an attribute from the node.
   * @param name The name of the attribute to remove.
   */
  removeAttribute(name: string) {
    if (this.attrs) {
      delete this.attrs[name];
    }

    return this;
  }

  toJSON(): {
    type: string;
    attrs?: Record<string, any>;
    content?: JSONContent[];
    marks?: MarkType[];
    text?: string;
  } {
    const obj: {
      type: string;
      attrs?: Record<string, any>;
      content?: JSONContent[];
      marks?: MarkType[];
      text?: string;
    } = {
      type: this.type,
    };

    if (this.attrs) {
      obj.attrs = this.attrs;
    }

    if (this.content) {
      obj.content = this.content.map((node) => node.toJSON());
    }

    if (this.marks) {
      obj.marks = this.marks.map((mark) => mark.toJSON());
    }

    if (this.text) {
      obj.text = this.text;
    }

    return obj;
  }
}

export class Mark {
  public type: string;
  public attrs?: Record<string, any>;

  constructor({ type, attrs }: MarkType) {
    this.type = type;
    this.attrs = attrs;
  }

  /**
   * Sets the attributes of the node.
   * @param attrs The attributes to set.
   */
  setAttributes(attrs: AnyJSONContent["attrs"]) {
    this.attrs = { ...this.attrs, ...attrs };
    return this;
  }

  /**
   * Adds an attribute to the node.
   * @param name The key of the attribute to add.
   * @param value The value of the attribute to add.
   */
  addAttribute(name: string, value: any) {
    this.attrs = {
      ...this.attrs,
      [name]: value,
    };
    return this;
  }

  toJSON(): MarkType {
    return {
      type: this.type,
      attrs: this.attrs,
    };
  }
}

export class Text extends Node {
  constructor({ text, marks }: { text: string; marks?: Mark[] | MarkType[] }) {
    super({ type: "text", text, marks });
  }
  addAttribute(_name: string, _value: any): this {
    throw new Error("Text nodes cannot have attributes.");
  }
  setAttributes(_attrs: AnyJSONContent["attrs"]): this {
    throw new Error("Text nodes cannot have attributes.");
  }
  addNode(_node: Node): this {
    throw new Error("Text nodes cannot have content.");
  }
  insertNode(_node: Node, _index?: number): this {
    throw new Error("Text nodes cannot have content.");
  }
  removeNode(_index: number): this {
    throw new Error("Text nodes cannot have content.");
  }
  toJSON(): TextType {
    const obj: TextType = {
      type: "text",
      text: this.text!,
    };

    if (this.marks) {
      obj.marks = this.marks.map((mark) => mark.toJSON());
    }

    return obj;
  }
}

export class Document extends Node {
  constructor() {
    super({ type: "doc", content: [] });
  }
  addAttribute(_name: string, _value: any): this {
    throw new Error("Text nodes cannot have attributes.");
  }
  setAttributes(_attrs: AnyJSONContent["attrs"]): this {
    throw new Error("Text nodes cannot have attributes.");
  }
  toJSON(): DocumentType {
    const obj: DocumentType = {
      type: "doc",
      content: [],
    };

    if (this.content) {
      obj.content = this.content.map((node) => node.toJSON());
    }

    return obj;
  }
}
