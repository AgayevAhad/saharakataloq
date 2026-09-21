import React from 'react';
import {
  AirVent,
  AudioLines,
  Beef,
  Blend,
  CookingPot,
  Droplets,
  Fan,
  Flame,
  Grid2x2,
  Headphones,
  Microwave,
  Package,
  Refrigerator,
  Shirt,
  Tv,
  WashingMachine,
  Waves,
  Wind,
  Zap,
} from 'lucide-react';

interface CategoryGlyphProps {
  id: string;
  slug?: string;
  compact?: boolean;
  plain?: boolean;
}

/** One visual language for category marks across menus, filters, and product cards. */
export const CategoryGlyph: React.FC<CategoryGlyphProps> = ({
  id,
  slug,
  compact = false,
  plain = false,
}) => {
  const key = `${id} ${slug || ''}`.toLowerCase();
  const Icon = /dishwasher|qabyuyan/.test(key)
    ? Droplets
    : /washer|paltaryuyan/.test(key)
      ? WashingMachine
      : /dryer|quruducu/.test(key)
        ? Shirt
        : /refrigerator|soyuducu/.test(key)
          ? Refrigerator
          : /airfryer|fritöz/.test(key)
            ? Flame
            : /microwave|mikrodal/.test(key)
              ? Microwave
              : /cooktop|bişirmə|bisirme|panel/.test(key)
                ? Grid2x2
                : /oven|soba/.test(key)
                  ? CookingPot
                  : /hood|aspirator/.test(key)
                    ? AirVent
                    : /air_conditioner|kondisioner|iqlim/.test(key)
                      ? Fan
                      : /vacuum|tozsoran/.test(key)
                        ? Wind
                        : /thermopot|çaydan|caydan|kettle/.test(key)
                          ? Zap
                          : /blender/.test(key)
                            ? Blend
                            : /tv|televizor/.test(key)
                              ? Tv
                              : /audio|soundbar/.test(key)
                                ? AudioLines
                                : /headphone|qulaq/.test(key)
                                  ? Headphones
                                  : /meat_grinder|ətçəkən|etceken/.test(key)
                                    ? Beef
                                    : /iron|ütü|utu/.test(key)
                                      ? Waves
                                      : Package;

  return (
    <span
      className={`category-glyph ${compact ? 'is-compact' : ''} ${plain ? 'is-plain' : ''}`}
      data-category-glyph={id}
      aria-hidden="true"
    >
      <Icon size={compact ? 14 : 16} strokeWidth={2.15} />
    </span>
  );
};
