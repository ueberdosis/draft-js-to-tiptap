import type { RawDraftEntity } from "draft-js";

import { type NodeType, createNode } from "../utils";
import type { MapEntityToNodeFn } from "../draftConverter";

export const entityToNodeMapping: Record<
  string,
  (entity: RawDraftEntity) => NodeType | null
> = {
  HORIZONTAL_RULE: () => {
    return createNode("horizontalRule");
  },
  IMAGE: (entity) => {
    return {
      type: "image",
      attrs: {
        src: entity.data.src,
        alt: entity.data.alt,
      },
    };
  },
};

export const mapEntityToNode: MapEntityToNodeFn = function ({
  range: { key },
  entityMap,
}) {
  if (entityToNodeMapping[entityMap[key].type]) {
    return entityToNodeMapping[entityMap[key].type](entityMap[key]);
  }

  return null;
};
