# talkbox

なにかの Next.js

## PstgreSQL 16 with pgvector 0.7.x or later

```sh:
docker pull pgvector/pgvector:pg16
docker run --net=host -e POSTGRES_PASSWORD='xxxxxxxx' pgvector/pgvector
```

※ for macOS

```sh:
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD='xxxxxxxx' pgvector/pgvector:pg16
```

## CREATE EXTENSION & TABLE

```sql:
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS talk_box (talk_id SERIAL PRIMARY KEY, haiku VARCHAR(32) NOT NULL, haijin_name VARCHAR(32) NOT NULL, token VARCHAR(36) NOT NULL, winning VARCHAR(255), embedding vector(1024));
CREATE TABLE IF NOT EXISTS setting (setting_id SERIAL PRIMARY KEY, talk_on BOOLEAN);
INSERT INTO setting (talk_on) VALUES (true);
```
