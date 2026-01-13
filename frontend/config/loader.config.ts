import { type LoaderEffect } from '@/components/LogoLoader';

export const LOADER_CONFIG = {
  defaultEffect: 'fade-spin' as LoaderEffect,
  defaultSize: 'md' as const,
  // Easy to change in future - just update defaultEffect here
};
