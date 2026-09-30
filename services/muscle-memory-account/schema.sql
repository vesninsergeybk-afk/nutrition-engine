CREATE TABLE IF NOT EXISTS mm_users (
  id uuid PRIMARY KEY,
  username text NOT NULL,
  username_norm text NOT NULL UNIQUE,
  email text NOT NULL,
  email_norm text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mm_consents (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES mm_users(id) ON DELETE CASCADE,
  consent_version text NOT NULL,
  consent_text_hash text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mm_sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES mm_users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS mm_sessions_user_id_idx ON mm_sessions(user_id);
CREATE INDEX IF NOT EXISTS mm_sessions_expires_at_idx ON mm_sessions(expires_at);

CREATE TABLE IF NOT EXISTS mm_password_resets (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES mm_users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);
CREATE INDEX IF NOT EXISTS mm_password_resets_user_id_idx ON mm_password_resets(user_id);

CREATE TABLE IF NOT EXISTS mm_progress (
  user_id uuid PRIMARY KEY REFERENCES mm_users(id) ON DELETE CASCADE,
  revision integer NOT NULL DEFAULT 0,
  store jsonb NOT NULL DEFAULT '{"version":1,"updatedAt":0,"records":{},"confusions":{},"sessions":[]}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
