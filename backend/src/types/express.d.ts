// Express type extensions for better cloud deployment compatibility
import { User } from '@supabase/supabase-js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      token?: string;
      userRole?: string;
    }
  }
}

export {};