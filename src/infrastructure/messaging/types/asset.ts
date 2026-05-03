export interface AssetMessage {
  bucket: string;
  filename: string;
  mimeType: string;
  objectKey: string;
  size: number;
  uploadedAt: Date;
}

export type AssetType = 'image' | 'unknown' | 'video';

const IMAGE_MIME_PREFIXES = ['image/'];
const VIDEO_MIME_PREFIXES = ['video/'];

export function detectAssetType(mimeType: string): AssetType {
  if (IMAGE_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix))) return 'image';
  if (VIDEO_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix))) return 'video';
  return 'unknown';
}
