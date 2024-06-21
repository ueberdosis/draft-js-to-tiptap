import type { RawDraftEntity } from "draft-js";

import { type MarkType } from "../utils";
import type { DraftConverter } from "../draftConverter";
import type { MapEntityToMarkFn } from "../types";

export const entityToMarkMapping: Record<
  string,
  (context: {
    entity: RawDraftEntity;
    converter: DraftConverter;
  }) => MarkType | null
> = {
  LINK: ({ entity }) => {
    return {
      type: "link",
      attrs: {
        href: entity.data.url,
        target: entity.data.target,
      },
    };
  },
};

export const mapEntityToMark: MapEntityToMarkFn = function ({
  range: { key },
  entityMap,
  converter,
}) {
  if (entityToMarkMapping[entityMap[key].type]) {
    return entityToMarkMapping[entityMap[key].type]({
      entity: entityMap[key],
      converter,
    });
  }

  return null;
};
