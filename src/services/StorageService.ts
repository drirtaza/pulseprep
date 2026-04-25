// Re-export StorageService from utils for component compatibility
export { StorageService as default, StorageService } from '../utils/storageUtils';

// Re-export individual methods for named imports
export {
  safeGetItem,
  safeSetItem,
  getMedicalSystems,
  createQuestion,
  updateQuestion,
  getStorageInfo,
  cleanupStorage,
  debugStorageUsage,
  optimizeUserData
} from '../utils/storageUtils';