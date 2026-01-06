-- ============================================================================
-- Chat Sessions Table
-- Stores session-level metadata and client information
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,

  -- Client metadata (privacy-compliant)
  ip_hash TEXT NOT NULL,  -- SHA-256 hash of IP address
  user_agent TEXT,
  browser_name TEXT,
  browser_version TEXT,
  os_name TEXT,
  os_version TEXT,
  device_type TEXT,  -- 'desktop', 'mobile', 'tablet', 'bot'

  -- Geolocation (requires Edge runtime or external service)
  country_code TEXT,
  region TEXT,
  city TEXT,
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  timezone TEXT,

  -- Session tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  message_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,

  -- Retention
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days')
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_chat_sessions_session_id ON chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_expires_at ON chat_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_ip_hash ON chat_sessions(ip_hash);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_country_code ON chat_sessions(country_code);

-- ============================================================================
-- Chat Messages Table
-- Stores individual messages (user inputs and AI responses)
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,

  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- Message metadata
  message_index INTEGER NOT NULL,  -- Position in conversation (0-based)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- AI response metadata (only for assistant messages)
  model_name TEXT,  -- e.g., 'gpt-4o'
  temperature NUMERIC(3, 2),
  latency_ms INTEGER,
  token_count INTEGER,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,

  -- Error tracking
  has_error BOOLEAN DEFAULT FALSE,
  error_message TEXT,

  UNIQUE(session_id, message_index)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role);

-- ============================================================================
-- Message Chunks Table
-- Links messages to retrieved RAG chunks with similarity scores
-- ============================================================================
CREATE TABLE IF NOT EXISTS message_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,

  -- Reference to original document
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  -- Chunk data (denormalized for governance/audit)
  chunk_content TEXT NOT NULL,  -- Full text of retrieved chunk
  chunk_metadata JSONB,  -- Original metadata from documents table

  -- Retrieval metadata
  similarity_score NUMERIC(5, 4) NOT NULL,  -- Cosine similarity (0-1)
  rank_position INTEGER NOT NULL,  -- 1-based rank in retrieval results

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_message_chunks_message_id ON message_chunks(message_id);
CREATE INDEX IF NOT EXISTS idx_message_chunks_document_id ON message_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_message_chunks_similarity_score ON message_chunks(similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_message_chunks_created_at ON message_chunks(created_at);

-- ============================================================================
-- Utility Functions
-- ============================================================================

-- Automatic update of updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_session_timestamp();

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE chat_sessions IS 'Session-level tracking for chat conversations with privacy-compliant client metadata';
COMMENT ON TABLE chat_messages IS 'Individual messages in conversations (user + assistant)';
COMMENT ON TABLE message_chunks IS 'RAG chunks retrieved for each message with similarity scores';
COMMENT ON COLUMN chat_sessions.ip_hash IS 'SHA-256 hash of client IP address for privacy compliance';
COMMENT ON COLUMN chat_sessions.expires_at IS 'Automatic expiration date (90 days from creation)';
