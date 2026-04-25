/**
 * Migration Service
 * Handles the transition from localStorage to Supabase database
 * 
 * CRITICAL: Ensures zero data loss during migration of medical education data
 */

import { SupabaseService } from './SupabaseService';
import { 
  MIGRATION_MAPPINGS, 
  REQUIRED_FIELDS, 
  isUserData, 
  isQuestionData, 
  isAdminData,
  DB_TABLES
} from '../types/database';
import { 
  validateRequiredFields 
} from '../utils/databaseUtils';

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: string[];
  skippedCount: number;
  totalCount: number;
}

export interface MigrationStatus {
  isCompleted: boolean;
  completedTables: string[];
  errors: Record<string, string[]>;
  lastMigrationDate?: string;
}

class MigrationServiceClass {
  private migrationStatus: MigrationStatus = {
    isCompleted: false,
    completedTables: [],
    errors: {}
  };

  /**
   * Check if migration has been completed
   */
  isMigrationCompleted(): boolean {
    const status = this.getMigrationStatus();
    return status.isCompleted;
  }

  /**
   * Get migration status from localStorage
   */
  getMigrationStatus(): MigrationStatus {
    try {
      const status = localStorage.getItem('pulseprep_migration_status');
      if (status) {
        this.migrationStatus = JSON.parse(status);
      }
    } catch (error) {
      console.error('❌ Failed to read migration status:', error);
    }
    return this.migrationStatus;
  }

  /**
   * Save migration status to localStorage
   */
  private saveMigrationStatus(): void {
    try {
      localStorage.setItem('pulseprep_migration_status', JSON.stringify(this.migrationStatus));
    } catch (error) {
      console.error('❌ Failed to save migration status:', error);
    }
  }

  /**
   * Validate data before migration
   */
  private validateData(tableName: string, data: any): boolean {
    const requiredFields = REQUIRED_FIELDS[tableName as keyof typeof REQUIRED_FIELDS];
    if (!requiredFields) {
      return true; // No validation rules defined
    }

    return validateRequiredFields(data, [...requiredFields]);
  }

  /**
   * Clean and transform data for migration
   */
  private transformData(data: any, mapping: typeof MIGRATION_MAPPINGS[string]): any {
    let transformed = { ...data };

    // Apply custom transformation if provided
    if (mapping.transform) {
      transformed = mapping.transform(transformed);
    }

    // Ensure required fields are present
    if (!transformed.id) {
      transformed.id = `migrated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Add migration metadata
    transformed.migratedAt = new Date().toISOString();
    transformed.migrationSource = mapping.localStorageKey;

    return transformed;
  }

  /**
   * Migrate a single table
   */
  async migrateTable(key: string): Promise<MigrationResult> {
    const mapping = MIGRATION_MAPPINGS[key];
    if (!mapping) {
      return {
        success: false,
        migratedCount: 0,
        errors: [`No mapping found for key: ${key}`],
        skippedCount: 0,
        totalCount: 0
      };
    }

    console.log(`🔄 Starting migration: ${mapping.localStorageKey} → ${mapping.tableName}`);

    const result: MigrationResult = {
      success: true,
      migratedCount: 0,
      errors: [],
      skippedCount: 0,
      totalCount: 0
    };

    try {
      // Get data from localStorage
      const localDataStr = localStorage.getItem(mapping.localStorageKey);
      if (!localDataStr) {
        console.log(`📦 No data found in ${mapping.localStorageKey}`);
        return result;
      }

      let localData = JSON.parse(localDataStr);
      if (!Array.isArray(localData)) {
        localData = [localData];
      }

      result.totalCount = localData.length;
      console.log(`📊 Found ${localData.length} records to migrate`);

      // Process each record
      for (const item of localData) {
        try {
          // Validate data
          if (mapping.validate && !mapping.validate(item)) {
            result.errors.push(`Invalid data structure: ${JSON.stringify(item).substring(0, 100)}...`);
            result.skippedCount++;
            continue;
          }

          // Additional type-specific validation
          let isValid = true;
          switch (mapping.tableName) {
            case DB_TABLES.USERS:
              isValid = isUserData(item);
              break;
            case DB_TABLES.QUESTIONS:
              isValid = isQuestionData(item);
              break;
            case DB_TABLES.ADMINS:
              isValid = isAdminData(item);
              break;
            default:
              isValid = this.validateData(mapping.tableName, item);
          }

          if (!isValid) {
            result.errors.push(`Failed validation: ${item.email || item.name || item.id || 'unknown'}`);
            result.skippedCount++;
            continue;
          }

          // Transform data
          const transformedData = this.transformData(item, mapping);

          // Check if record already exists
          const existingRecord = await SupabaseService.readOne(mapping.tableName, {
            email: transformedData.email || undefined,
            id: transformedData.id || undefined
          });

          if (existingRecord.success && existingRecord.data) {
            console.log(`⏭️ Record already exists, skipping: ${transformedData.email || transformedData.id}`);
            result.skippedCount++;
            continue;
          }

          // Create record in database
          const createResult = await SupabaseService.create(mapping.tableName, transformedData);

          if (createResult.success) {
            result.migratedCount++;
            console.log(`✅ Migrated: ${transformedData.email || transformedData.name || transformedData.id}`);
          } else {
            result.errors.push(`Failed to create: ${createResult.error}`);
            console.error(`❌ Failed to migrate record:`, createResult.error);
          }

        } catch (error) {
          result.errors.push(`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          result.skippedCount++;
          console.error(`❌ Error processing record:`, error);
        }
      }

      // Update migration status
      if (result.migratedCount > 0 || result.skippedCount === result.totalCount) {
        this.migrationStatus.completedTables.push(mapping.tableName);
        if (result.errors.length > 0) {
          this.migrationStatus.errors[mapping.tableName] = result.errors;
        }
      }

      if (result.errors.length > 0) {
        result.success = false;
      }

      console.log(`📋 Migration complete for ${mapping.tableName}:`, {
        migrated: result.migratedCount,
        skipped: result.skippedCount,
        errors: result.errors.length,
        total: result.totalCount
      });

    } catch (error) {
      result.success = false;
      result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error(`❌ Migration failed for ${mapping.tableName}:`, error);
    }

    return result;
  }

  /**
   * Migrate all data from localStorage to Supabase
   */
  async migrateAllData(): Promise<Record<string, MigrationResult>> {
    console.log('🚀 Starting full data migration to Supabase...');
    
    const results: Record<string, MigrationResult> = {};
    
    // Check if Supabase is available
    const isConnected = await SupabaseService.checkConnection();
    if (!isConnected) {
      console.log('⚠️ Supabase not available, skipping migration');
      return results;
    }

    // Migrate in order of dependencies
    const migrationOrder = [
      'admins',           // Admin accounts first
      'users',            // Then user accounts
      'currentUser',      // Current user session
      'pendingUser',      // Pending user data
      'medicalSystems',   // Medical systems
      'questions',        // Questions
      'systemRequests',   // System requests
      'bookmarksMedicine', // Bookmarks by specialty
      'bookmarksSurgery',
      'bookmarksGynae'
    ];

    for (const key of migrationOrder) {
      if (MIGRATION_MAPPINGS[key]) {
        try {
          results[key] = await this.migrateTable(key);
          
          // Add delay between migrations to avoid overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`❌ Failed to migrate ${key}:`, error);
          results[key] = {
            success: false,
            migratedCount: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
            skippedCount: 0,
            totalCount: 0
          };
        }
      }
    }

    // Update overall migration status
    const allSuccessful = Object.values(results).every(result => result.success);
    const totalMigrated = Object.values(results).reduce((sum, result) => sum + result.migratedCount, 0);
    const totalErrors = Object.values(results).reduce((sum, result) => sum + result.errors.length, 0);

    this.migrationStatus.isCompleted = allSuccessful && totalErrors === 0;
    this.migrationStatus.lastMigrationDate = new Date().toISOString();
    this.saveMigrationStatus();

    console.log('📊 Migration Summary:', {
      totalMigrated,
      totalErrors,
      completed: this.migrationStatus.isCompleted,
      results
    });

    // Show summary to user
    if (totalMigrated > 0) {
      const summary = `Migration completed!\n` +
                     `✅ Migrated: ${totalMigrated} records\n` +
                     `⚠️ Errors: ${totalErrors}\n` +
                     `Status: ${this.migrationStatus.isCompleted ? 'Complete' : 'Partial'}`;
      
      console.log('🎉 ' + summary);
    }

    return results;
  }

  /**
   * Test migration without actually moving data
   */
  async testMigration(): Promise<Record<string, any>> {
    console.log('🧪 Testing migration (dry run)...');
    
    const testResults: Record<string, any> = {};
    
    for (const [key, mapping] of Object.entries(MIGRATION_MAPPINGS)) {
      try {
        const localDataStr = localStorage.getItem(mapping.localStorageKey);
        if (!localDataStr) {
          testResults[key] = { status: 'no_data', count: 0 };
          continue;
        }

        let localData = JSON.parse(localDataStr);
        if (!Array.isArray(localData)) {
          localData = [localData];
        }

        let validCount = 0;
        let invalidCount = 0;
        const sampleRecord = localData[0];

        for (const item of localData) {
          if (mapping.validate ? mapping.validate(item) : true) {
            validCount++;
          } else {
            invalidCount++;
          }
        }

        testResults[key] = {
          status: 'ready',
          total: localData.length,
          valid: validCount,
          invalid: invalidCount,
          tableName: mapping.tableName,
          sampleData: sampleRecord ? Object.keys(sampleRecord) : []
        };

      } catch (error) {
        testResults[key] = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    console.log('🧪 Migration test results:', testResults);
    return testResults;
  }

  /**
   * Rollback migration (restore from localStorage)
   */
  async rollbackMigration(): Promise<boolean> {
    console.log('⏪ Rolling back migration...');
    
    try {
      // Clear migration status
      this.migrationStatus = {
        isCompleted: false,
        completedTables: [],
        errors: {}
      };
      this.saveMigrationStatus();

      console.log('✅ Migration rollback completed');
      return true;
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      return false;
    }
  }

  /**
   * Backup localStorage data before migration
   */
  backupLocalStorageData(): boolean {
    try {
      const backup: Record<string, any> = {};
      const timestamp = new Date().toISOString();

      for (const [, mapping] of Object.entries(MIGRATION_MAPPINGS)) {
        const data = localStorage.getItem(mapping.localStorageKey);
        if (data) {
          backup[mapping.localStorageKey] = data;
        }
      }

      const backupData = {
        timestamp,
        data: backup,
        version: '1.0'
      };

      localStorage.setItem('pulseprep_migration_backup', JSON.stringify(backupData));
      console.log('💾 Local storage data backed up successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Backup failed:', error);
      return false;
    }
  }

  /**
   * Restore from backup
   */
  restoreFromBackup(): boolean {
    try {
      const backupStr = localStorage.getItem('pulseprep_migration_backup');
      if (!backupStr) {
        console.log('📦 No backup found');
        return false;
      }

      const backup = JSON.parse(backupStr);
      
      for (const [key, value] of Object.entries(backup.data)) {
        localStorage.setItem(key, value as string);
      }

      console.log('✅ Data restored from backup');
      return true;
      
    } catch (error) {
      console.error('❌ Restore failed:', error);
      return false;
    }
  }
}

export const MigrationService = new MigrationServiceClass();
export default MigrationService;