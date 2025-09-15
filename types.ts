export enum Tool {
  IMAGE_STUDIO = 'IMAGE_STUDIO',
  VIDEO_GENERATOR = 'VIDEO_GENERATOR',
}

export interface EditedImagePart {
  type: 'text' | 'image';
  content: string;
}
