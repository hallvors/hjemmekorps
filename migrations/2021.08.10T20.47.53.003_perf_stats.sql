CREATE TABLE perf_stats (
    id serial PRIMARY KEY,
    measurement TEXT,
    ts TIMESTAMP DEFAULT NOW(),
    ua TEXT,
    project TEXT,
    userid TEXT,
    ms TEXT,
    context JSONB
);

