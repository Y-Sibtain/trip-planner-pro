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

import express from 'express';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(bodyParser.json());

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_SECRET = process.env.ADMIN_SECRET!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ADMIN_SECRET) {
  console.error('Missing required environment variables. Exiting.');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

app.post('/admin/delete-account', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Missing authorization header' });
    // Example protection: simple secret token in Authorization header
    // Authorization: Bearer <ADMIN_SECRET>
    const token = authHeader.split(' ')[1];
    if (token !== ADMIN_SECRET) return res.status(403).json({ error: 'Forbidden' });

    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId in request body' });

    // 1) Delete profile row (public.profiles)
    const { error: delProfileError } = await supabaseAdmin.from('profiles').delete().eq('id', userId);
    if (delProfileError) {
      console.warn('Failed to delete profile row:', delProfileError);
      // continue to attempt deleting auth user
    }

    // 2) Delete other related rows (saved_itineraries etc.) if you have them
    // await supabaseAdmin.from('saved_itineraries').delete().eq('owner_id', userId);

    // 3) Permanently delete user from auth via Admin API
    const adminResp = await fetch(`${SUPABASE_URL}/admin/v1/users/${userId}`, {
      method: 'DELETE',
      headers: {
        apiKey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });

    if (!adminResp.ok) {
      const text = await adminResp.text();
      console.error('Failed to delete auth user via admin API:', text);
      return res.status(500).json({ error: 'Failed to delete user in auth' });
    }

    return res.json({ ok: true, message: 'User permanently deleted' });
  } catch (err: any) {
    console.error('delete-account error:', err);
    return res.status(500).json({ error: err?.message ?? 'Server error' });
  }
});

const PORT = process.env.PORT || 8888;
app.listen(PORT, () => {
  console.log(`Admin delete-account server running on port ${PORT}`);
});