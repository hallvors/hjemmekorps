CREATE TABLE errors_client (
    id serial PRIMARY KEY,
    message TEXT,
    stack TEXT,
    ts TIMESTAMP DEFAULT NOW(),
    ua TEXT,
    project TEXT,
    userid TEXT,
    url TEXT,
    context JSONB
);

