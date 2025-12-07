/**
 * Server-side endpoint to fetch all auth users (admin-only).
 * 
 * IMPORTANT:
 * - This uses the Supabase service_role (admin) key to access auth.users
 * - DO NOT expose the service_role key to the client
 * - This endpoint must be protected and only callable by admins
 *
 * Usage:
 * - GET /admin/list-users
 *   Headers:
 *     Authorization: Bearer <USER_JWT>
 *
 * The endpoint will:
 *  - Verify the user is an admin
 *  - Return list of all users from auth.users with email and created_at
 */

import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const clientSupabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
      };
    }
  }
}

// Middleware to verify admin
const verifyAdmin = async (req: Request, res: Response, next: Function) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Get user from token
    const { data: { user }, error: userError } = await clientSupabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user is admin
    const { data, error } = await clientSupabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (error || !data) {
      return res.status(403).json({ error: 'Not an admin' });
    }

    (req as any).user = { id: user.id, email: user.email };
    next();
  } catch (err) {
    console.error('Auth verification error:', err);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// GET /admin/list-users - List all auth users
app.get('/admin/list-users', verifyAdmin, async (req: Request, res: Response) => {
  try {
    // Fetch all users from auth.users using admin client
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Failed to fetch users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    // Map to include only relevant fields that match the auth.users table structure
    const mappedUsers = (data?.users || []).map((user: any) => ({
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata || {},
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed_at: user.email_confirmed_at,
      phone: user.phone,
    }));

    res.json({ users: mappedUsers });
  } catch (err) {
    console.error('Error listing users:', err);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

export default app;
