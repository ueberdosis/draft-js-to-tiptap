import type { RawDraftEntity } from "draft-js";

import { type NodeType, createNode } from "../utils";
import type { DraftConverter, MapEntityToNodeFn } from "../draftConverter";

export const entityToNodeMapping: Record<
  string,
  (context: {
    entity: RawDraftEntity;
    converter: DraftConverter;
  }) => NodeType | null
> = {
  HORIZONTAL_RULE: () => {
    return createNode("horizontalRule");
  },
  IMAGE: ({ entity }) => {
    return createNode("image", {
      attrs: {
        src: entity.data.src,
        alt: entity.data.alt,
      },
    });
  },
};

export const mapEntityToNode: MapEntityToNodeFn = function ({
  range: { key },
  entityMap,
  converter,
}) {
  if (entityToNodeMapping[entityMap[key].type]) {
    return entityToNodeMapping[entityMap[key].type]({
      entity: entityMap[key],
      converter,
    });
  }

  return null;
};
