/**
 * Server endpoint to update auth user metadata using Supabase service role key.
 * - Expects Authorization: Bearer <access_token> (user JWT)
 * - Body: { full_name?: string, phone?: string }
 * The endpoint verifies the access token to determine the user id, then uses the
 * Supabase service role key to update the auth user metadata server-side.
 */

import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(bodyParser.json());

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars for admin/update-user');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

app.post('/admin/update-user', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing Authorization header' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify token and get user id
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const userId = userData.user.id;
    const { full_name, phone } = req.body || {};

    // Use admin API to update user metadata
    // Note: supabase-js provides admin APIs under auth.admin
    // We'll try calling admin.updateUser, falling back to admin.updateUserById if needed.
    try {
      // Primary attempt using admin.updateUser (supported in some versions)
      // If not available, this will throw and we'll handle alternative.
      // @ts-ignore
      const result = await supabaseAdmin.auth.admin.updateUser(userId, {
        user_metadata: { full_name: full_name ?? null, phone: phone ?? null },
      });

      // When using supabase-js admin.updateUser, result may be shaped differently
      if ((result as any).error) {
        throw (result as any).error;
      }

      res.json({ message: 'User metadata updated' });
      return;
    } catch (e) {
      // Try alternative admin API call pattern
      try {
        // @ts-ignore
        const alt = await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { full_name: full_name ?? null, phone: phone ?? null },
        });
        if ((alt as any).error) throw (alt as any).error;
        res.json({ message: 'User metadata updated' });
        return;
      } catch (err: any) {
        console.error('Admin updateUser error:', err?.message ?? err);
        res.status(500).json({ error: err?.message ?? 'Failed to update user via admin API' });
        return;
      }
    }
  } catch (err: any) {
    console.error('update-user error:', err);
    res.status(500).json({ error: err?.message ?? 'Server error' });
  }
});

export default app;
