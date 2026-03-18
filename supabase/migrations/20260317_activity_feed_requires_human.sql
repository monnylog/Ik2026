-- ════════════════════════════════════════════════════════════════
-- IK26 Migration: activity_feed requires_human filter
-- Date: 2026-03-17
-- Purpose: Surface items that need Monica's direct attention
--          without requiring her to read the full activity feed.
-- ════════════════════════════════════════════════════════════════

-- 1. Ensure the metadata column exists and has the requires_human key indexed
-- (activity_feed.metadata is already jsonb — this adds a partial index)
CREATE INDEX IF NOT EXISTS idx_activity_feed_requires_human
  ON activity_feed ((metadata->>'requires_human'))
  WHERE metadata->>'requires_human' = 'true';

-- 2. Create a view: leadership_action_items
--    Returns only activity_feed rows that require human review,
--    ordered by most recent first, with chef name joined.
CREATE OR REPLACE VIEW leadership_action_items AS
SELECT
  af.id,
  af.created_at,
  af.type,
  af.content,
  af.metadata,
  af.chef_id,
  c.name        AS chef_name,
  c.course_assignment AS chef_course
FROM activity_feed af
LEFT JOIN chefs c ON c.id = af.chef_id
WHERE
  af.metadata->>'requires_human' = 'true'
  AND NOT (af.metadata ? 'resolved' AND af.metadata->>'resolved' = 'true')
ORDER BY af.created_at DESC;

-- 3. Add a resolve function so Monica can mark items done from the app
--    Usage: SELECT resolve_action_item('<activity_feed_id>');
CREATE OR REPLACE FUNCTION resolve_action_item(item_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE activity_feed
  SET metadata = metadata || '{"resolved": true, "resolved_at": "' || NOW()::text || '"}'::jsonb
  WHERE id = item_id;
END;
$$;

-- 4. Grant read access to the view for the anon and authenticated roles
GRANT SELECT ON leadership_action_items TO anon, authenticated;

-- 5. Backfill: tag known high-priority types as requires_human = true
--    (Damdam wellness alerts, Bantay synthesis flags, Kuwento content drafts)
UPDATE activity_feed
SET metadata = metadata || '{"requires_human": true}'::jsonb
WHERE
  type IN ('damdam_wellness_alert', 'bantay_synthesis', 'kuwento_content_draft')
  AND (metadata->>'requires_human' IS NULL OR metadata->>'requires_human' = 'false');

-- ════════════════════════════════════════════════════════════════
-- How to use in the IK26 App (Figma Make / React):
--
--   const { data } = await supabase
--     .from('leadership_action_items')
--     .select('*')
--     .limit(20);
--
--   To resolve an item:
--   await supabase.rpc('resolve_action_item', { item_id: id });
-- ════════════════════════════════════════════════════════════════
