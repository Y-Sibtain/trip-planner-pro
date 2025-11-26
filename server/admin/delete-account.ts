/**
 * Example server-side endpoint to permanently delete a user (admin-only).
 *
 * IMPORTANT:
 * - This file is an example Express route using the Supabase service_role (admin) key.
 * - DO NOT deploy service_role key to client-side; keep it only on your trusted server environment.
 * - Protect this endpoint properly (e.g., require admin JWT, IP allowlist, or an admin secret).
 *
 * Usage:
 * - POST /admin/delete-account
 *   Headers:
 *     Authorization: Bearer <ADMIN_SECRET>      // or your chosen admin auth method
 *   Body (JSON):
 *     { "userId": "<uuid>" }
 *
 * The endpoint will:
 *  - Remove the user's profile (public.profiles)
 *  - Delete the user from auth (permanently) using the admin API
 *
 * NOTE: You must set environment variables:
 *  - SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY
 *  - ADMIN_SECRET (a server-side secret used to protect this endpoint)
 */

import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(bodyParser.json());

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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

// Admin endpoint to permanently delete a user account
app.post('/admin/delete-account', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    // Verify the requester is an admin
    const adminId = req.user?.id;
    if (!adminId) {
      res.status(401).json({ error: 'Unauthorized: Not authenticated' });
      return;
    }

    const { data: adminData, error: adminError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', adminId)
      .eq('role', 'admin')
      .single();

    if (adminError || !adminData) {
      res.status(403).json({ error: 'Unauthorized: Admin access required' });
      return;
    }

    // Delete user auth record (this cascades to profiles and other related data)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      res.status(500).json({ error: deleteError.message });
      return;
    }

    res.json({ message: 'User account permanently deleted' });
  } catch (err: any) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: err?.message ?? 'Failed to delete account' });
  }
});

export default app;