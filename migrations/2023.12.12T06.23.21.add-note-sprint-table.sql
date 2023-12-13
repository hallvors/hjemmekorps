CREATE TABLE note_sprint_game (
    user_id TEXT NOT NULL,
    band_id TEXT NOT NULL,
    "date" DATE DEFAULT CURRENT_DATE,
    points INT NOT NULL,
     UNIQUE (user_id, band_id, "date") -- only one entry will sum up all points for this user/band on a given day
);
