// Express Request interface extension
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