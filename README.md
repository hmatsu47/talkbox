# talkbox

なにかの Next.js

## PstgreSQL 16 with pgvector 0.7.x or later

```sh:
docker pull pgvector/pgvector:pg16
docker run --net=host -e POSTGRES_PASSWORD='xxxxxxxx' pgvector/pgvector:pg16
```

※ for macOS

```sh:
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD='xxxxxxxx' pgvector/pgvector:pg16
```

## CREATE EXTENSION & TABLE

```sql:
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS talk_box (talk_id SERIAL PRIMARY KEY, haiku VARCHAR(255) NOT NULL, haijin_name VARCHAR(32) NOT NULL, token VARCHAR(36) NOT NULL, hand_over INTEGER NOT NULL DEFAULT 0, winning VARCHAR(255), embedding vector(1024));
ALTER TABLE talk_box ADD CONSTRAINT unique_haiku UNIQUE (haiku);
CREATE TABLE IF NOT EXISTS setting (setting_id SERIAL PRIMARY KEY, talk_on BOOLEAN NOT NULL, win_fin BOOLEAN NOT NULL);
INSERT INTO setting (talk_on, win_fin) VALUES (true, false);
```
