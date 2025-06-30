-- Component Database Schema for PC Builder
-- Tracks all components from Reddit + manual sources with automated Amazon link management

-- 1. Components table - Master component registry
CREATE TABLE components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'cooler', 'case')),
  model_number VARCHAR(100),
  description TEXT,
  specs JSONB, -- Flexible specs storage (socket, powerDraw, capacity, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  source VARCHAR(50) DEFAULT 'manual', -- 'reddit', 'manual', 'autonomous'
  UNIQUE(name, brand) -- Prevent duplicate components
);

-- 2. Component pricing - Regional pricing data
CREATE TABLE component_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID REFERENCES components(id) ON DELETE CASCADE,
  region VARCHAR(5) NOT NULL CHECK (region IN ('US', 'CA', 'UK', 'DE', 'AU')),
  price_usd DECIMAL(10,2),
  currency VARCHAR(3) NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source VARCHAR(50) DEFAULT 'manual', -- 'amazon_api', 'manual', 'scraped'
  UNIQUE(component_id, region)
);

-- 3. Amazon product links - Tracks ASINs and link validity
CREATE TABLE amazon_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID REFERENCES components(id) ON DELETE CASCADE,
  region VARCHAR(5) NOT NULL CHECK (region IN ('US', 'CA', 'UK', 'DE', 'AU')),
  asin VARCHAR(20) NOT NULL,
  product_url TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT true,
  last_validated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validation_status VARCHAR(20) DEFAULT 'pending', -- 'valid', 'invalid', 'pending', 'not_found'
  amazon_title TEXT, -- Store Amazon's actual product title
  amazon_price DECIMAL(10,2),
  amazon_availability VARCHAR(50),
  match_confidence DECIMAL(3,2) DEFAULT 0.0, -- How confident we are this is the right product (0-1)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(component_id, region, asin)
);

-- 4. Reddit mentions - Track component mentions from Reddit
CREATE TABLE reddit_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID REFERENCES components(id) ON DELETE SET NULL,
  post_id VARCHAR(20) NOT NULL, -- Reddit post ID
  comment_id VARCHAR(20), -- Reddit comment ID (if from comment)
  subreddit VARCHAR(50) NOT NULL,
  mention_text TEXT NOT NULL,
  context TEXT, -- Surrounding text for context
  budget_range INTEGER, -- If mentioned in context of a budget
  sentiment VARCHAR(20), -- 'positive', 'negative', 'neutral'
  confidence DECIMAL(3,2) DEFAULT 0.0, -- Confidence in component extraction (0-1)
  post_created_at TIMESTAMP WITH TIME ZONE,
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, component_id) -- Prevent duplicate mentions from same post
);

-- 5. Link validation history - Track validation results over time
CREATE TABLE link_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amazon_link_id UUID REFERENCES amazon_links(id) ON DELETE CASCADE,
  validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) NOT NULL, -- 'valid', 'invalid', 'not_found', 'error'
  response_code INTEGER,
  error_message TEXT,
  validation_method VARCHAR(50) DEFAULT 'http_check' -- 'http_check', 'amazon_api', 'manual'
);

-- 6. Component popularity - Track how often components are mentioned/selected
CREATE TABLE component_popularity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID REFERENCES components(id) ON DELETE CASCADE,
  reddit_mentions_count INTEGER DEFAULT 0,
  selection_count INTEGER DEFAULT 0, -- How often selected in our app
  last_reddit_mention TIMESTAMP WITH TIME ZONE,
  popularity_score DECIMAL(10,2) DEFAULT 0.0, -- Calculated popularity score
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(component_id)
);

-- 7. System logs - Track automated processes
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'started', 'completed', 'failed'
  message TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_components_category ON components(category);
CREATE INDEX idx_components_brand ON components(brand);
CREATE INDEX idx_components_active ON components(is_active);
CREATE INDEX idx_amazon_links_component ON amazon_links(component_id);
CREATE INDEX idx_amazon_links_region ON amazon_links(region);
CREATE INDEX idx_amazon_links_valid ON amazon_links(is_valid);
CREATE INDEX idx_reddit_mentions_subreddit ON reddit_mentions(subreddit);
CREATE INDEX idx_reddit_mentions_budget ON reddit_mentions(budget_range);
CREATE INDEX idx_component_popularity_score ON component_popularity(popularity_score DESC);

-- RLS (Row Level Security) - Add basic security
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE reddit_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_popularity ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access" ON components FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON component_pricing FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON amazon_links FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON reddit_mentions FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON link_validations FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON component_popularity FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON system_logs FOR SELECT USING (true);

-- Functions to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_components_updated_at BEFORE UPDATE ON components FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_amazon_links_updated_at BEFORE UPDATE ON amazon_links FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_component_popularity_updated_at BEFORE UPDATE ON component_popularity FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate popularity score
CREATE OR REPLACE FUNCTION calculate_popularity_score(component_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  reddit_count INTEGER;
  selection_count INTEGER;
  recency_factor DECIMAL;
  score DECIMAL;
BEGIN
  -- Get current counts
  SELECT reddit_mentions_count, selection_count 
  FROM component_popularity 
  WHERE component_id = component_uuid
  INTO reddit_count, selection_count;
  
  -- Calculate recency factor (higher for recent mentions)
  SELECT CASE 
    WHEN last_reddit_mention > NOW() - INTERVAL '7 days' THEN 2.0
    WHEN last_reddit_mention > NOW() - INTERVAL '30 days' THEN 1.5
    WHEN last_reddit_mention > NOW() - INTERVAL '90 days' THEN 1.0
    ELSE 0.5
  END
  FROM component_popularity 
  WHERE component_id = component_uuid
  INTO recency_factor;
  
  -- Calculate score: (reddit_mentions * 10 + selections * 5) * recency_factor
  score := (COALESCE(reddit_count, 0) * 10 + COALESCE(selection_count, 0) * 5) * COALESCE(recency_factor, 0.5);
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;