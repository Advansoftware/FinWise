// src/services/pluggy/index.ts

/**
 * Pluggy Service Module
 * Export barrel for all Pluggy-related services and types
 */

// Types
export * from './pluggy.types';

// Client
export {
  PluggyClient,
  getPluggyClient,
  getPluggyConfig,
  resetPluggyClient,
  type PluggyClientConfig,
} from './pluggy.client';

// Service
export {
  PluggyService,
  getPluggyService,
  resetPluggyService,
} from './pluggy.service';
