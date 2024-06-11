import type { RawDraftEntity } from "draft-js";

import { type MarkType } from "../utils";
import type { MapEntityToMarkFn } from "../draftConverter";

export const entityToMarkMapping: Record<
  string,
  (entity: RawDraftEntity) => MarkType | null
> = {
  LINK: (entity) => {
    return {
      type: "link",
      attrs: {
        href: entity.data.url,
        target: entity.data.target,
      },
    };
  },
};

export const mapEntityToMark: MapEntityToMarkFn = function (
  { key },
  entityMap
) {
  if (entityToMarkMapping[entityMap[key].type]) {
    return entityToMarkMapping[entityMap[key].type](entityMap[key]);
  }

  return null;
};
