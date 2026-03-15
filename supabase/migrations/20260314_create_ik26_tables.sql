-- ════════════════════════════════════════════════════════════════
-- IK26 OPS CENTER — Supabase Schema Migration
-- ════════════════════════════════════════════════════════════════
-- Creates ik26_sponsors and ik26_orgs tables with RLS policies
-- Owner: Monica Blanco (monica.istorya@gmail.com)
-- Date: March 14, 2026
-- ════════════════════════════════════════════════════════════════

-- ── Drop existing tables if they exist ──────────────────────────
DROP TABLE IF EXISTS ik26_sponsors CASCADE;
DROP TABLE IF EXISTS ik26_orgs CASCADE;

-- ── Table: ik26_sponsors ────────────────────────────────────────
-- Stores confirmed sponsor opportunities from Notion
-- Populated by Apps Script Flow C (Notion → Supabase)

CREATE TABLE ik26_sponsors (
  -- Primary key: Notion page ID
  id TEXT PRIMARY KEY,
  
  -- Sponsor details
  org_name TEXT NOT NULL,
  type TEXT, -- Sponsorship, Partnership, Media/PR, etc.
  partner_tier TEXT, -- Community Ally, Cultural Partner, Anchor Sponsor, etc.
  
  -- Branding & visibility
  logo_url TEXT,
  story_blurb TEXT, -- From "Relationship Story" in Notion
  visibility_score TEXT, -- Low, Medium, High
  
  -- Metadata
  confirmed_date TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for common queries
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on confirmed_date for sorting
CREATE INDEX idx_ik26_sponsors_confirmed_date ON ik26_sponsors(confirmed_date DESC);

-- Index on partner_tier for filtering
CREATE INDEX idx_ik26_sponsors_tier ON ik26_sponsors(partner_tier);

-- ── Table: ik26_orgs ────────────────────────────────────────────
-- Stores all organizations (sponsors, partners, vendors, etc.)
-- Populated by Apps Script Flow C from Notion Organizations DB

CREATE TABLE ik26_orgs (
  -- Primary key: Notion page ID
  id TEXT PRIMARY KEY,
  
  -- Organization details
  name TEXT NOT NULL,
  type TEXT, -- Sponsor, Media, Community Org, Vendor, Partner, Venue, Other
  region TEXT, -- Las Vegas, National, Philippines, Other
  ik_chapter TEXT, -- Origins, Year 2, Year 3 (Fil-Am), Residency
  
  -- Community impact (array of tags)
  community_impact TEXT[] DEFAULT '{}',
  
  -- Metadata
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on name for searching/sorting
CREATE INDEX idx_ik26_orgs_name ON ik26_orgs(name);

-- Index on type for filtering
CREATE INDEX idx_ik26_orgs_type ON ik26_orgs(type);

-- GIN index for community_impact array searches
CREATE INDEX idx_ik26_orgs_community_impact ON ik26_orgs USING GIN(community_impact);

-- ══════════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ══════════════════════════════════════════════════════════════════

-- Enable RLS on both tables
ALTER TABLE ik26_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ik26_orgs ENABLE ROW LEVEL SECURITY;

-- ── ik26_sponsors RLS Policies ──────────────────────────────────

-- Policy 1: Public read access (anon role)
-- Anyone can SELECT confirmed sponsors (for public-facing app)
CREATE POLICY "ik26_sponsors_public_read"
  ON ik26_sponsors
  FOR SELECT
  TO anon
  USING (true);

-- Policy 2: Service role has full access
-- Apps Script uses service_role key to INSERT/UPDATE/DELETE
CREATE POLICY "ik26_sponsors_service_write"
  ON ik26_sponsors
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── ik26_orgs RLS Policies ──────────────────────────────────────

-- Policy 1: Public read access (anon role)
CREATE POLICY "ik26_orgs_public_read"
  ON ik26_orgs
  FOR SELECT
  TO anon
  USING (true);

-- Policy 2: Service role has full access
CREATE POLICY "ik26_orgs_service_write"
  ON ik26_orgs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════
-- COMMENTS
-- ══════════════════════════════════════════════════════════════════

COMMENT ON TABLE ik26_sponsors IS 'Confirmed sponsor opportunities synced from Notion. Public read-only, service_role write.';
COMMENT ON TABLE ik26_orgs IS 'All organizations synced from Notion. Public read-only, service_role write.';

COMMENT ON COLUMN ik26_sponsors.id IS 'Notion page ID (primary key)';
COMMENT ON COLUMN ik26_sponsors.org_name IS 'Organization name';
COMMENT ON COLUMN ik26_sponsors.partner_tier IS 'Community Ally, Cultural Partner, Anchor Sponsor, In-Kind Supporter, Media Partner';
COMMENT ON COLUMN ik26_sponsors.visibility_score IS 'Low, Medium, High — determines prominence in app';
COMMENT ON COLUMN ik26_sponsors.story_blurb IS 'Relationship story from Notion (why this partner matters)';

COMMENT ON COLUMN ik26_orgs.id IS 'Notion page ID (primary key)';
COMMENT ON COLUMN ik26_orgs.community_impact IS 'Array of tags: Education, Heritage, Mutual Aid, Youth, Arts, Food Access';
COMMENT ON COLUMN ik26_orgs.ik_chapter IS 'Origins, Year 2, Year 3 (Fil-Am), Residency';

-- ══════════════════════════════════════════════════════════════════
-- SAMPLE DATA (for testing only — remove in production)
-- ══════════════════════════════════════════════════════════════════

-- Uncomment to insert sample data for local testing:
/*
INSERT INTO ik26_sponsors (id, org_name, type, partner_tier, visibility_score, story_blurb)
VALUES
  ('sample-001', 'Tock', 'Sponsorship', 'Anchor Sponsor', 'High', 'Long-time partner supporting Filipino culinary excellence'),
  ('sample-002', 'Resorts World Las Vegas', 'Partnership', 'Cultural Partner', 'High', 'Venue partner for IK26 Residency'),
  ('sample-003', 'Philippine Airlines', 'In-Kind', 'In-Kind Supporter', 'Medium', 'Flight support for chefs from Manila');

INSERT INTO ik26_orgs (id, name, type, region, ik_chapter, community_impact)
VALUES
  ('org-001', 'Tock', 'Sponsor', 'National', 'Origins', ARRAY['Education', 'Food Access']),
  ('org-002', 'Resorts World Las Vegas', 'Venue', 'Las Vegas', 'Residency', ARRAY['Heritage', 'Arts']),
  ('org-003', 'Philippine Airlines', 'Partner', 'Philippines', 'Year 3 (Fil-Am)', ARRAY['Heritage']);
*/

-- ══════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ══════════════════════════════════════════════════════════════════
