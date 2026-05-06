CREATE TABLE IF NOT EXISTS public.user
(
    id uuid NOT NULL PRIMARY KEY default uuidv4(),
    first_name varchar(100)  NOT NULL,
	last_name varchar(100),
    role varchar(30)  NOT NULL CHECK (role IN ('user', 'admin', 'guest')),
    email varchar(100)  NOT NULL UNIQUE,
    password_hash varchar(72) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.file (
  id            uuid          NOT NULL PRIMARY KEY DEFAULT uuidv4(),
  top_id		uuid		  NOT NULL REFERENCES file(id) ON DELETE CASCADE,
  object_key    VARCHAR(1000),
  bucket		VARCHAR(500),
  ext           VARCHAR(50),
  mime_type     VARCHAR(150),
  size          INTEGER       ,
  progress		INTEGER		  NOT NULL DEFAULT 0,
  status         VARCHAR(100) NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  created_at	TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS tag (
  id 	SERIAL NOT NULL PRIMARY KEY,
  word	VARCHAR(200) NOT NULL UNIQUE
);

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_tag_word_trgm ON tag USING gin (word gin_trgm_ops);

CREATE TABLE IF NOT EXISTS ref_file_tag (
	id SERIAL NOT NULL PRIMARY KEY,
	file_id 	uuid 	NOT NULL REFERENCES file(id),
	tag_id		INTEGER	NOT NULL REFERENCES tag(id)
);
CREATE INDEX idx_ref_file_tag_name ON ref_file_tag (tag_id);


