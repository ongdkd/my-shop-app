import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database";

// Supabase configuration
const supabaseUrl = process.env["SUPABASE_URL"];
const supabaseServiceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
const supabaseAnonKey = process.env["SUPABASE_ANON_KEY"];

if (!supabaseUrl) {
  console.warn(
    "⚠️  SUPABASE_URL environment variable is missing - Supabase features will be disabled"
  );
}

if (!supabaseServiceRoleKey) {
  console.warn(
    "⚠️  SUPABASE_SERVICE_ROLE_KEY environment variable is missing - Supabase features will be disabled"
  );
}

if (!supabaseAnonKey) {
  console.warn(
    "⚠️  SUPABASE_ANON_KEY environment variable is missing - Supabase features will be disabled"
  );
}

// Create Supabase client with service role key (bypasses RLS)
export const supabaseAdmin: SupabaseClient<Database> | null =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

// Create Supabase client with anon key (for user authentication)
export const supabaseClient: SupabaseClient<Database> | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Database connection test
export const testDatabaseConnection = async (): Promise<boolean> => {
  if (!supabaseAdmin) {
    console.warn(
      "⚠️  Supabase not configured - skipping database connection test"
    );
    return false;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("count")
      .limit(1);

    if (error) {
      console.error("Database connection test failed:", error.message);
      return false;
    }

    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("Database connection test error:", error);
    return false;
  }
};

// Helper function to get user from JWT token
export const getUserFromToken = async (token: string) => {
  if (!supabaseClient) {
    throw new Error("Supabase client not configured");
  }

  try {
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser(token);

    if (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }

    return user;
  } catch (error) {
    throw new Error(`Token validation failed: ${error}`);
  }
};

// Helper function to verify service role access
export const verifyServiceRole = async (): Promise<boolean> => {
  if (!supabaseAdmin) {
    console.warn(
      "⚠️  Supabase admin client not configured - skipping service role verification"
    );
    return false;
  }

  try {
    // Try to access a protected operation that only service role can perform
    const { error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error("Service role verification failed:", error.message);
      return false;
    }

    console.log("✅ Service role access verified");
    return true;
  } catch (error) {
    console.error("Service role verification error:", error);
    return false;
  }
};

// Export default admin client for most operations
export default supabaseAdmin;
