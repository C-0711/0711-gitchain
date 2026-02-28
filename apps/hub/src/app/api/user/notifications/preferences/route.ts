import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";

const DEFAULT_EMAIL_PREFERENCES = {
  container_pushed: true,
  pr_review_requested: true,
  pr_merged: true,
  mention: true,
  chain_anchored: false,
  compliance_failed: true,
  access_granted: true,
  invite_received: true,
  security_alert: true,
  user_followed: false,
  container_starred: false,
  container_forked: true,
};

/**
 * GET /api/user/notifications/preferences
 * Get notification preferences for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT
         email_enabled,
         web_enabled,
         email_preferences,
         digest_enabled,
         digest_frequency,
         digest_day,
         digest_hour,
         updated_at
       FROM notification_preferences
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Return defaults
      return NextResponse.json({
        emailEnabled: true,
        webEnabled: true,
        emailPreferences: DEFAULT_EMAIL_PREFERENCES,
        digestEnabled: false,
        digestFrequency: "daily",
        digestDay: 1,
        digestHour: 9,
      });
    }

    const row = result.rows[0];
    return NextResponse.json({
      emailEnabled: row.email_enabled,
      webEnabled: row.web_enabled,
      emailPreferences: row.email_preferences,
      digestEnabled: row.digest_enabled,
      digestFrequency: row.digest_frequency,
      digestDay: row.digest_day,
      digestHour: row.digest_hour,
      updatedAt: row.updated_at,
    });
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/user/notifications/preferences
 * Update notification preferences
 */
export async function PUT(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      emailEnabled,
      webEnabled,
      emailPreferences,
      digestEnabled,
      digestFrequency,
      digestDay,
      digestHour,
    } = body;

    // Validate digest settings
    if (digestFrequency && !["daily", "weekly"].includes(digestFrequency)) {
      return NextResponse.json(
        { error: "Invalid digest frequency. Use 'daily' or 'weekly'" },
        { status: 400 }
      );
    }

    if (digestDay !== undefined && (digestDay < 1 || digestDay > 7)) {
      return NextResponse.json(
        { error: "Invalid digest day. Use 1-7 (Monday=1)" },
        { status: 400 }
      );
    }

    if (digestHour !== undefined && (digestHour < 0 || digestHour > 23)) {
      return NextResponse.json(
        { error: "Invalid digest hour. Use 0-23" },
        { status: 400 }
      );
    }

    // Upsert preferences
    const result = await pool.query(
      `INSERT INTO notification_preferences (
         user_id,
         email_enabled,
         web_enabled,
         email_preferences,
         digest_enabled,
         digest_frequency,
         digest_day,
         digest_hour,
         updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         email_enabled = COALESCE($2, notification_preferences.email_enabled),
         web_enabled = COALESCE($3, notification_preferences.web_enabled),
         email_preferences = COALESCE($4, notification_preferences.email_preferences),
         digest_enabled = COALESCE($5, notification_preferences.digest_enabled),
         digest_frequency = COALESCE($6, notification_preferences.digest_frequency),
         digest_day = COALESCE($7, notification_preferences.digest_day),
         digest_hour = COALESCE($8, notification_preferences.digest_hour),
         updated_at = NOW()
       RETURNING *`,
      [
        userId,
        emailEnabled ?? true,
        webEnabled ?? true,
        emailPreferences ? JSON.stringify(emailPreferences) : JSON.stringify(DEFAULT_EMAIL_PREFERENCES),
        digestEnabled ?? false,
        digestFrequency ?? "daily",
        digestDay ?? 1,
        digestHour ?? 9,
      ]
    );

    const row = result.rows[0];
    return NextResponse.json({
      emailEnabled: row.email_enabled,
      webEnabled: row.web_enabled,
      emailPreferences: row.email_preferences,
      digestEnabled: row.digest_enabled,
      digestFrequency: row.digest_frequency,
      digestDay: row.digest_day,
      digestHour: row.digest_hour,
      updatedAt: row.updated_at,
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
