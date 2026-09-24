import React from 'react';
import { ImageCropStudioModal } from '../../ImageCropStudioModal';
import { ThemeColors } from '../../../types/theme';
import { ProductMedia } from '../../../types/product';

export interface MediaSectionProps {
  theme: ThemeColors;
  isOpen: boolean;
  imageUrl: string;
  productTitle?: string;
  initialObjectPosition?: string;
  initialFitMode?: 'contain' | 'cover';
  onClose: () => void;
  onSavePosition: (position: string, fitMode: 'contain' | 'cover') => void;
  onSaveCroppedImage: (newUrl: string, position?: string) => void;
  onUpload: (file: File) => Promise<string | ProductMedia>;
}

export const MediaSection = ({
  theme,
  isOpen,
  imageUrl,
  productTitle,
  initialObjectPosition,
  initialFitMode,
  onClose,
  onSavePosition,
  onSaveCroppedImage,
  onUpload,
}: MediaSectionProps) => {
  return (
    <ImageCropStudioModal
      isOpen={isOpen}
      imageUrl={imageUrl}
      productTitle={productTitle}
      initialObjectPosition={initialObjectPosition}
      initialFitMode={initialFitMode}
      theme={theme}
      onClose={onClose}
      onSavePosition={onSavePosition}
      onSaveCroppedImage={onSaveCroppedImage}
      onUpload={async (file) => {
        const res = await onUpload(file);
        return typeof res === 'string' ? res : res.url;
      }}
    />
  );
};
