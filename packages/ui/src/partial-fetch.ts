import {
  createSqlfuUiPartialFetch as createPartialFetchWithAssets,
  type CreateSqlfuUiPartialFetchInput as BaseCreateSqlfuUiPartialFetchInput,
  type SqlfuUiAsset,
  type SqlfuUiAssetBody,
  type SqlfuUiAssets,
  type SqlfuUiPartialFetch,
} from 'sqlfu/ui/browser';
import bundledSqlfuUiAssets from './serialized-assets.js';

export const sqlfuUiAssets: SqlfuUiAssets = bundledSqlfuUiAssets;

export type CreateSqlfuUiPartialFetchInput = Omit<BaseCreateSqlfuUiPartialFetchInput, 'assets'> & {
  assets?: SqlfuUiAssets;
};

export type {SqlfuUiAsset, SqlfuUiAssetBody, SqlfuUiAssets, SqlfuUiPartialFetch};

export function createSqlfuUiPartialFetch(input: CreateSqlfuUiPartialFetchInput): SqlfuUiPartialFetch {
  return createPartialFetchWithAssets({
    ...input,
    assets: input.assets || sqlfuUiAssets,
  });
}
