-- CalendRun Database Schema
-- This schema is designed for event-driven architecture (no foreign keys)

-- Challenge Template table
CREATE TABLE IF NOT EXISTS challenge_template (
  id UUID PRIMARY KEY,
  flowcore_event_id UUID UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL,
  required_distances_km DECIMAL(10,2)[] NOT NULL,
  full_distance_total_km DECIMAL(10,2) NOT NULL,
  half_distance_total_km DECIMAL(10,2) NOT NULL,
  theme_key VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Challenge Instance table
CREATE TABLE IF NOT EXISTS challenge_instance (
  id UUID PRIMARY KEY,
  flowcore_event_id UUID UNIQUE,
  template_id UUID NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  variant VARCHAR(50) NOT NULL,
  theme_key VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'completed')),
  total_completed_km DECIMAL(10,2),
  succeeded BOOLEAN,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Club table
CREATE TABLE IF NOT EXISTS club (
  id UUID PRIMARY KEY,
  flowcore_event_id UUID UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  invite_token VARCHAR(255) NOT NULL UNIQUE,
  logo_url TEXT,
  welcome_text JSONB,
  short_description JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Club Membership table
CREATE TABLE IF NOT EXISTS club_membership (
  id UUID PRIMARY KEY,
  flowcore_event_id UUID UNIQUE,
  club_id UUID NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(club_id, user_id)
);

-- Performance (Run Performance) table
CREATE TABLE IF NOT EXISTS performance (
  id UUID PRIMARY KEY,
  flowcore_event_id UUID UNIQUE,
  instance_id UUID NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  runner_name VARCHAR(255),
  run_date DATE NOT NULL,
  distance_km DECIMAL(10,2) NOT NULL,
  time_minutes INTEGER,
  notes TEXT,
  status VARCHAR(50) NOT NULL CHECK (status IN ('planned', 'completed', 'skipped', 'deleted')),
  recorded_at TIMESTAMP WITH TIME ZONE,
  change_log JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Subscription table
CREATE TABLE IF NOT EXISTS subscription (
  id UUID PRIMARY KEY,
  flowcore_event_id UUID UNIQUE,
  user_id VARCHAR(255) NOT NULL,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')),
  current_period_end TIMESTAMP WITH TIME ZONE,
  price_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Discount Code table
CREATE TABLE IF NOT EXISTS discount_code (
  id UUID PRIMARY KEY,
  flowcore_event_id UUID UNIQUE,
  code VARCHAR(255) NOT NULL UNIQUE,
  bundle_id UUID,
  discount_type VARCHAR(50) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10,2) NOT NULL,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  redeemed_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Discount Bundle table
CREATE TABLE IF NOT EXISTS discount_bundle (
  id UUID PRIMARY KEY,
  flowcore_event_id UUID UNIQUE,
  club_name VARCHAR(255),
  purchased_by VARCHAR(255),
  stripe_invoice_id VARCHAR(255),
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'active', 'expired')),
  code_count INTEGER NOT NULL,
  price_amount DECIMAL(10,2) NOT NULL,
  code_ids UUID[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- User table
CREATE TABLE IF NOT EXISTS "user" (
  id VARCHAR(255) PRIMARY KEY,
  flowcore_event_id UUID UNIQUE,
  name VARCHAR(255),
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- User Settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  flowcore_event_id UUID UNIQUE,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Performance Log table (audit log for all performance events)
CREATE TABLE IF NOT EXISTS performance_log (
  flowcore_event_id UUID PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('run.logged.0', 'run.updated.0', 'run.deleted.0')),
  performance_id UUID NOT NULL,
  instance_id UUID NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  runner_name VARCHAR(255),
  run_date DATE,
  distance_km DECIMAL(10,2),
  time_minutes INTEGER,
  notes TEXT,
  status VARCHAR(50),
  recorded_at TIMESTAMP WITH TIME ZONE,
  change_log JSONB,
  event_payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_challenge_instance_template_id ON challenge_instance(template_id);
CREATE INDEX IF NOT EXISTS idx_challenge_instance_user_id ON challenge_instance(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_instance_status ON challenge_instance(status);
CREATE INDEX IF NOT EXISTS idx_club_invite_token ON club(invite_token);
CREATE INDEX IF NOT EXISTS idx_club_membership_club_id ON club_membership(club_id);
CREATE INDEX IF NOT EXISTS idx_club_membership_user_id ON club_membership(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_instance_id ON performance(instance_id);
CREATE INDEX IF NOT EXISTS idx_performance_user_id ON performance(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_run_date ON performance(run_date);
CREATE INDEX IF NOT EXISTS idx_subscription_user_id ON subscription(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_stripe_subscription_id ON subscription(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_discount_code_code ON discount_code(code);
CREATE INDEX IF NOT EXISTS idx_discount_bundle_purchased_by ON discount_bundle(purchased_by);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_id ON "user"(id);
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
CREATE INDEX IF NOT EXISTS idx_performance_log_user_id ON performance_log(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_log_performance_id ON performance_log(performance_id);
CREATE INDEX IF NOT EXISTS idx_performance_log_event_type ON performance_log(event_type);
CREATE INDEX IF NOT EXISTS idx_performance_log_created_at ON performance_log(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_log_run_date ON performance_log(run_date);

