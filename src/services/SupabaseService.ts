/**
 * Supabase Service Wrapper
 * Handles all database operations with automatic camelCase ↔ snake_case conversion
 * 
 * CRITICAL: Maintains backward compatibility while migrating to Supabase
 * All medical education data operations flow through this service
 */

import { 
  toSnakeCase, 
  toCamelCase, 
  batchToCamelCase
} from '../utils/databaseUtils';

// Mock Supabase client for now - replace with actual Supabase import
interface SupabaseClient {
  from: (table: string) => SupabaseQueryBuilder;
  auth: {
    signUp: (data: any) => Promise<any>;
    signIn: (data: any) => Promise<any>;
    signOut: () => Promise<any>;
    getUser: () => Promise<any>;
  };
}

interface SupabaseQueryBuilder {
  select: (columns?: string) => SupabaseQueryBuilder;
  insert: (data: any) => SupabaseQueryBuilder;
  update: (data: any) => SupabaseQueryBuilder;
  delete: () => SupabaseQueryBuilder;
  eq: (column: string, value: any) => SupabaseQueryBuilder;
  neq: (column: string, value: any) => SupabaseQueryBuilder;
  gt: (column: string, value: any) => SupabaseQueryBuilder;
  gte: (column: string, value: any) => SupabaseQueryBuilder;
  lt: (column: string, value: any) => SupabaseQueryBuilder;
  lte: (column: string, value: any) => SupabaseQueryBuilder;
  like: (column: string, pattern: string) => SupabaseQueryBuilder;
  in: (column: string, values: any[]) => SupabaseQueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => SupabaseQueryBuilder;
  limit: (count: number) => SupabaseQueryBuilder;
  single: () => Promise<{ data: any; error: any }>;
  execute?: () => Promise<{ data: any; error: any }>;
  then: (callback: (result: { data: any; error: any }) => any) => Promise<any>;
}

// Mock implementation - will be replaced with actual Supabase
const createMockSupabase = (): SupabaseClient => {
  const mockQuery = (): SupabaseQueryBuilder => ({
    select: () => mockQuery(),
    insert: () => mockQuery(),
    update: () => mockQuery(),
    delete: () => mockQuery(),
    eq: () => mockQuery(),
    neq: () => mockQuery(),
    gt: () => mockQuery(),
    gte: () => mockQuery(),
    lt: () => mockQuery(),
    lte: () => mockQuery(),
    like: () => mockQuery(),
    in: () => mockQuery(),
    order: () => mockQuery(),
    limit: () => mockQuery(),
    single: async () => ({ data: null, error: { message: 'Mock mode - Supabase not connected' } }),
    then: async (callback) => callback({ data: null, error: { message: 'Mock mode - Supabase not connected' } })
  });

  return {
    from: () => mockQuery(),
    auth: {
      signUp: async () => ({ data: null, error: { message: 'Mock mode - Supabase not connected' } }),
      signIn: async () => ({ data: null, error: { message: 'Mock mode - Supabase not connected' } }),
      signOut: async () => ({ data: null, error: null }),
      getUser: async () => ({ data: null, error: { message: 'Mock mode - Supabase not connected' } })
    }
  };
};

// Initialize with mock - replace with: import { createClient } from '@supabase/supabase-js'
// const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
const supabase = createMockSupabase();

export interface DatabaseResponse<T = any> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface DatabaseListResponse<T = any> {
  data: T[];
  error: string | null;
  success: boolean;
  count?: number;
}

/**
 * Enhanced Supabase Service with automatic conversion and error handling
 */
class SupabaseServiceClass {
  private isConnected = false;
  private fallbackToLocalStorage = true;

  /**
   * Check if Supabase is properly connected
   */
  async checkConnection(): Promise<boolean> {
    try {
      // Replace with actual connection check
      // const { data, error } = await supabase.from('health_check').select('1').limit(1);
      // this.isConnected = !error;
      this.isConnected = false; // Mock mode
      return this.isConnected;
    } catch (error) {
      console.warn('🔗 Supabase connection failed, using localStorage fallback');
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Fallback to localStorage if Supabase is not available
   */
  private getFromLocalStorage(key: string, defaultValue: any = null): any {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`❌ Failed to read from localStorage: ${key}`, error);
      return defaultValue;
    }
  }

  private setToLocalStorage(key: string, value: any): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`❌ Failed to write to localStorage: ${key}`, error);
      return false;
    }
  }

  /**
   * CREATE - Insert a new record
   */
  async create<T = any>(table: string, data: any): Promise<DatabaseResponse<T>> {
    try {
      if (!this.isConnected && this.fallbackToLocalStorage) {
        // Fallback to localStorage
        const storageKey = `pulseprep_${table}`;
        const existingData = this.getFromLocalStorage(storageKey, []);
        
        const newRecord = {
          ...data,
          id: data.id || `${table}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          created_at: data.created_at || data.createdAt || new Date().toISOString()
        };
        
        existingData.push(newRecord);
        const success = this.setToLocalStorage(storageKey, existingData);
        
        return {
          data: toCamelCase(newRecord) as T,
          error: success ? null : 'Failed to save to localStorage',
          success
        };
      }

      // Convert to snake_case for database
      const snakeCaseData = toSnakeCase(data);
      
      const { data: result, error } = await supabase
        .from(table)
        .insert(snakeCaseData)
        .select()
        .single();

      if (error) {
        console.error(`❌ Failed to create ${table}:`, error);
        return {
          data: null,
          error: error.message || 'Create operation failed',
          success: false
        };
      }

      // Convert back to camelCase for frontend
      return {
        data: toCamelCase(result) as T,
        error: null,
        success: true
      };
    } catch (error) {
      console.error(`❌ Create operation failed for ${table}:`, error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * READ - Get records with filters
   */
  async read<T = any>(
    table: string, 
    filters?: Record<string, any>,
    options?: {
      select?: string;
      orderBy?: string;
      ascending?: boolean;
      limit?: number;
    }
  ): Promise<DatabaseListResponse<T>> {
    try {
      if (!this.isConnected && this.fallbackToLocalStorage) {
        // Fallback to localStorage
        const storageKey = `pulseprep_${table}`;
        let data = this.getFromLocalStorage(storageKey, []);
        
        // Apply filters
        if (filters) {
          data = data.filter((item: any) => {
            return Object.entries(filters).every(([key, value]) => {
              const snakeKey = toSnakeCase({ [key]: value });
              const snakeKeyStr = Object.keys(snakeKey)[0];
              return item[key] === value || item[snakeKeyStr] === value;
            });
          });
        }
        
        // Apply sorting
        if (options?.orderBy) {
          const orderKey = options.orderBy;
          data.sort((a: any, b: any) => {
            const aVal = a[orderKey] || a[toSnakeCase({ [orderKey]: '' })[Object.keys(toSnakeCase({ [orderKey]: '' }))[0]]];
            const bVal = b[orderKey] || b[toSnakeCase({ [orderKey]: '' })[Object.keys(toSnakeCase({ [orderKey]: '' }))[0]]];
            
            if (options.ascending === false) {
              return bVal > aVal ? 1 : -1;
            }
            return aVal > bVal ? 1 : -1;
          });
        }
        
        // Apply limit
        if (options?.limit) {
          data = data.slice(0, options.limit);
        }
        
        return {
          data: batchToCamelCase(data),
          error: null,
          success: true,
          count: data.length
        };
      }

      let query = supabase.from(table);
      
      if (options?.select) {
        query = query.select(options.select);
      } else {
        query = query.select('*');
      }
      
      // Apply filters (convert to snake_case)
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          const snakeKey = toSnakeCase({ [key]: value });
          const snakeKeyStr = Object.keys(snakeKey)[0];
          query = query.eq(snakeKeyStr, value);
        });
      }
      
      // Apply ordering
      if (options?.orderBy) {
        const snakeOrderBy = toSnakeCase({ [options.orderBy]: '' });
        const snakeOrderByStr = Object.keys(snakeOrderBy)[0];
        query = query.order(snakeOrderByStr, { ascending: options.ascending !== false });
      }
      
      // Apply limit
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data: result, error } = await query;

      if (error) {
        console.error(`❌ Failed to read ${table}:`, error);
        return {
          data: [],
          error: error.message || 'Read operation failed',
          success: false
        };
      }

      return {
        data: batchToCamelCase(result || []),
        error: null,
        success: true,
        count: result?.length || 0
      };
    } catch (error) {
      console.error(`❌ Read operation failed for ${table}:`, error);
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * READ ONE - Get a single record
   */
  async readOne<T = any>(table: string, filters: Record<string, any>): Promise<DatabaseResponse<T>> {
    const result = await this.read<T>(table, filters, { limit: 1 });
    
    return {
      data: result.data[0] || null,
      error: result.error,
      success: result.success
    };
  }

  /**
   * UPDATE - Update existing record
   */
  async update<T = any>(
    table: string, 
    filters: Record<string, any>, 
    updates: any
  ): Promise<DatabaseResponse<T>> {
    try {
      if (!this.isConnected && this.fallbackToLocalStorage) {
        // Fallback to localStorage
        const storageKey = `pulseprep_${table}`;
        const data = this.getFromLocalStorage(storageKey, []);
        
        const index = data.findIndex((item: any) => {
          return Object.entries(filters).every(([key, value]) => {
            return item[key] === value || item[toSnakeCase({ [key]: value })[Object.keys(toSnakeCase({ [key]: value }))[0]]] === value;
          });
        });
        
        if (index === -1) {
          return {
            data: null,
            error: 'Record not found',
            success: false
          };
        }
        
        const updatedRecord = {
          ...data[index],
          ...updates,
          updated_at: new Date().toISOString()
        };
        
        data[index] = updatedRecord;
        const success = this.setToLocalStorage(storageKey, data);
        
        return {
          data: toCamelCase(updatedRecord) as T,
          error: success ? null : 'Failed to update localStorage',
          success
        };
      }

      const snakeCaseUpdates = toSnakeCase({
        ...updates,
        updated_at: new Date().toISOString()
      });

      let query = supabase.from(table).update(snakeCaseUpdates);
      
      // Apply filters (convert to snake_case)
      Object.entries(filters).forEach(([key, value]) => {
        const snakeKey = toSnakeCase({ [key]: value });
        const snakeKeyStr = Object.keys(snakeKey)[0];
        query = query.eq(snakeKeyStr, value);
      });

      const { data: result, error } = await query.select().single();

      if (error) {
        console.error(`❌ Failed to update ${table}:`, error);
        return {
          data: null,
          error: error.message || 'Update operation failed',
          success: false
        };
      }

      return {
        data: toCamelCase(result) as T,
        error: null,
        success: true
      };
    } catch (error) {
      console.error(`❌ Update operation failed for ${table}:`, error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * DELETE - Remove record
   */
  async delete(table: string, filters: Record<string, any>): Promise<DatabaseResponse<boolean>> {
    try {
      if (!this.isConnected && this.fallbackToLocalStorage) {
        // Fallback to localStorage
        const storageKey = `pulseprep_${table}`;
        const data = this.getFromLocalStorage(storageKey, []);
        
        const filteredData = data.filter((item: any) => {
          return !Object.entries(filters).every(([key, value]) => {
            return item[key] === value || item[toSnakeCase({ [key]: value })[Object.keys(toSnakeCase({ [key]: value }))[0]]] === value;
          });
        });
        
        const success = this.setToLocalStorage(storageKey, filteredData);
        
        return {
          data: success,
          error: success ? null : 'Failed to delete from localStorage',
          success
        };
      }

      let query = supabase.from(table).delete();
      
      // Apply filters (convert to snake_case)
      Object.entries(filters).forEach(([key, value]) => {
        const snakeKey = toSnakeCase({ [key]: value });
        const snakeKeyStr = Object.keys(snakeKey)[0];
        query = query.eq(snakeKeyStr, value);
      });

      const { error } = await query;

      if (error) {
        console.error(`❌ Failed to delete from ${table}:`, error);
        return {
          data: false,
          error: error.message || 'Delete operation failed',
          success: false
        };
      }

      return {
        data: true,
        error: null,
        success: true
      };
    } catch (error) {
      console.error(`❌ Delete operation failed for ${table}:`, error);
      return {
        data: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Specialized methods for common operations
   */

  // Users table operations
  async createUser(userData: any) {
    return this.create('users', userData);
  }

  async getUserByEmail(email: string) {
    return this.readOne('users', { email });
  }

  async updateUser(email: string, updates: any) {
    return this.update('users', { email }, updates);
  }

  // Questions table operations
  async createQuestion(questionData: any) {
    return this.create('questions', questionData);
  }

  async getQuestionsBySpecialty(specialty: string) {
    return this.read('questions', { specialty, status: 'approved' });
  }

  async updateQuestion(id: string, updates: any) {
    return this.update('questions', { id }, updates);
  }

  // Admin table operations
  async createAdmin(adminData: any) {
    return this.create('admins', adminData);
  }

  async getAdminByEmail(email: string) {
    return this.readOne('admins', { email });
  }

  // Medical Systems table operations
  async getMedicalSystems(specialty?: string) {
    const filters = specialty ? { specialty } : {};
    return this.read('medical_systems', filters);
  }

  /**
   * Migration helpers
   */
  async migrateFromLocalStorage(table: string, localStorageKey: string): Promise<boolean> {
    try {
      const localData = this.getFromLocalStorage(localStorageKey, []);
      
      if (localData.length === 0) {
        console.log(`📦 No data to migrate from ${localStorageKey}`);
        return true;
      }

      console.log(`🔄 Migrating ${localData.length} records from ${localStorageKey} to ${table}`);
      
      for (const item of localData) {
        const result = await this.create(table, item);
        if (!result.success) {
          console.error(`❌ Failed to migrate record:`, item, result.error);
        }
      }
      
      console.log(`✅ Migration completed for ${table}`);
      return true;
    } catch (error) {
      console.error(`❌ Migration failed for ${table}:`, error);
      return false;
    }
  }

  /**
   * Batch operations for better performance
   */
  async batchCreate(table: string, records: any[]): Promise<DatabaseListResponse> {
    try {
      if (!this.isConnected && this.fallbackToLocalStorage) {
        const results = [];
        for (const record of records) {
          const result = await this.create(table, record);
          if (result.success) {
            results.push(result.data);
          }
        }
        
        return {
          data: results,
          error: null,
          success: true,
          count: results.length
        };
      }

      const snakeCaseRecords = records.map(record => toSnakeCase(record));
      
      const { data: result, error } = await supabase
        .from(table)
        .insert(snakeCaseRecords)
        .select();

      if (error) {
        console.error(`❌ Batch create failed for ${table}:`, error);
        return {
          data: [],
          error: error.message || 'Batch create failed',
          success: false
        };
      }

      return {
        data: batchToCamelCase(result || []),
        error: null,
        success: true,
        count: result?.length || 0
      };
    } catch (error) {
      console.error(`❌ Batch create failed for ${table}:`, error);
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }
}

// Export singleton instance
export const SupabaseService = new SupabaseServiceClass();

// Initialize connection check
SupabaseService.checkConnection().then(connected => {
  console.log(connected ? '✅ Supabase connected' : '⚠️ Using localStorage fallback');
});

export default SupabaseService;