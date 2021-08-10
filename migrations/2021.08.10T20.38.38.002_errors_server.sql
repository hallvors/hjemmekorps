CREATE TABLE errors_server (
    id serial PRIMARY KEY,
    message TEXT,
    stack TEXT,
    ts TIMESTAMP DEFAULT NOW(),
    context JSONB
);

