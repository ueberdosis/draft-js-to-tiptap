# draftjs-to-tiptap

Convert Draft.js content to Tiptap-compatible content.

## Installation

```bash
npm install @tiptap/draftjs-to-tiptap
```

```bash
yarn add @tiptap/draftjs-to-tiptap
```

```bash
pnpm add @tiptap/draftjs-to-tiptap
```

```bash
bun add @tiptap/draftjs-to-tiptap
```

## Usage

Using the default conversions:

```typescript
import { DraftConverter } from '@tiptap/draftjs-to-tiptap';

const draftContent = {
  blocks: [
    {
      key: '1',
      text: 'Hello, world!',
      type: 'unstyled',
      depth: 0,
      inlineStyleRanges: [],
      entityRanges: [],
      data: {},
    },
  ],
  entityMap: {},
};

const convertDraftToTiptap = new DraftConverter();
const tiptapContent = convertDraftToTiptap.convert(draftContent);
```

You can configure the converter to use custom conversions for mapping:

- blocks & entities to nodes
- inline styles & entities to marks

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

To test:

```bash
bun test
```

To build:

```bash
bun build
```
