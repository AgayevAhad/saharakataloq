import { z } from 'zod';
import {
  BrandVerificationStatusEnumSchema,
  LogoRightsStatusEnumSchema,
  BrandSourceTypeEnumSchema,
  BrandSourceVerificationStatusEnumSchema,
  BrandCandidateCreateSchema,
  BrandCandidateBatchSchema,
  BrandSourceCreateSchema,
  BrandSourceStatusUpdateSchema,
  BrandAliasCreateSchema,
  BrandLogoRightsUpdateSchema,
  BrandVerificationStatusUpdateSchema,
  CategoryCreateSchema,
  CategoryMoveSchema,
  CategoryReorderSchema,
  CategoryArchiveSchema,
  CategorySpecTemplateSchema,
} from './phase3Schemas.mjs';

export type BrandVerificationStatus = z.infer<typeof BrandVerificationStatusEnumSchema>;
export type LogoRightsStatus = z.infer<typeof LogoRightsStatusEnumSchema>;
export type BrandSourceType = z.infer<typeof BrandSourceTypeEnumSchema>;
export type BrandSourceVerificationStatus = z.infer<typeof BrandSourceVerificationStatusEnumSchema>;
export type BrandCandidateCreateInput = z.infer<typeof BrandCandidateCreateSchema>;
export type BrandCandidateBatchInput = z.infer<typeof BrandCandidateBatchSchema>;
export type BrandSourceCreateInput = z.infer<typeof BrandSourceCreateSchema>;
export type BrandSourceStatusUpdateInput = z.infer<typeof BrandSourceStatusUpdateSchema>;
export type BrandAliasCreateInput = z.infer<typeof BrandAliasCreateSchema>;
export type BrandLogoRightsUpdateInput = z.infer<typeof BrandLogoRightsUpdateSchema>;
export type BrandVerificationStatusUpdateInput = z.infer<typeof BrandVerificationStatusUpdateSchema>;
export type CategoryCreateInput = z.infer<typeof CategoryCreateSchema>;
export type CategoryMoveInput = z.infer<typeof CategoryMoveSchema>;
export type CategoryReorderInput = z.infer<typeof CategoryReorderSchema>;
export type CategoryArchiveInput = z.infer<typeof CategoryArchiveSchema>;
export type CategorySpecTemplateInput = z.infer<typeof CategorySpecTemplateSchema>;
