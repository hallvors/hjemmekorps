const { sql } = require('slonik');
import * as env from '../../../../config/environment';

export async function get(req, res, next) {
  // We want to get various stats.. Sort of doodling, but what about
  // - user's today
  // - band's today
  // - user's streak
  // - band's streak
  // - user's total since forever?
  // - band's total since forever?
  // Maybe weekly, monthly are also interesting..? Maybe too much..

  try {
    const results = await env.slonik.connect(client => {
      return Promise.allSettled([
        // user TODAY
        client.query(
          sql`SELECT points FROM hit_note_game WHERE user_id = ${req.user._id} AND date = CURRENT_DATE`
        ),
        // band TODAY
        client.query(
          sql`SELECT SUM(points) as points FROM hit_note_game WHERE band_id = ${req.user.band._id} AND date = CURRENT_DATE`
        ),
        // band subgroup TODAY
        client.query(
          sql`SELECT SUM(points) as points FROM hit_note_game WHERE band_id = ${req.user.band._id} AND subgroup = ${req.user.subgroup} AND date = CURRENT_DATE`
        ),
        // raw data for user STREAK
        client.query(sql`WITH date_with_prev AS (
        SELECT
          date,
          LAG(date) OVER (ORDER BY date) AS prev_date
        FROM
          hit_note_game
        WHERE user_id = ${req.user._id}
      )
      SELECT
        date,
        prev_date,
        date - prev_date AS diff,
        CASE
          WHEN date - prev_date = 1 THEN 'streak'
          WHEN date - prev_date > 1 THEN 'start'
          WHEN prev_date IS NULL THEN 'start'
          ELSE 'end'
        END AS streak_status
      FROM
        date_with_prev;
      `),
        // raw data for band STREAK
        client.query(sql`WITH date_with_prev AS (
        SELECT
          date,
          LAG(date) OVER (ORDER BY date) AS prev_date
        FROM
          hit_note_game
        WHERE band_id = ${req.user.band._id}
      )
      SELECT
        date,
        prev_date,
        date - prev_date AS diff,
        CASE
          WHEN date - prev_date = 1 THEN 'streak'
          WHEN date - prev_date > 1 THEN 'start'
          WHEN prev_date IS NULL THEN 'start'
          ELSE 'end'
        END AS streak_status
      FROM
        date_with_prev;
      `),
        // raw data for band subgroup STREAK
        client.query(sql`WITH date_with_prev AS (
        SELECT
          date,
          LAG(date) OVER (ORDER BY date) AS prev_date
        FROM
          hit_note_game
        WHERE band_id = ${req.user.band._id} AND subgroup = ${req.user.subgroup}
      )
      SELECT
        date,
        prev_date,
        date - prev_date AS diff,
        CASE
          WHEN date - prev_date = 1 THEN 'streak'
          WHEN date - prev_date > 1 THEN 'start'
          WHEN prev_date IS NULL THEN 'start'
          ELSE 'end'
        END AS streak_status
      FROM
        date_with_prev;
      `),
        // user TOTALS
        client.query(
          sql`SELECT SUM(points) AS points FROM hit_note_game WHERE user_id = ${req.user._id}`
        ),
        // band TOTALS
        client.query(
          sql`SELECT SUM(points) AS points FROM hit_note_game WHERE band_id = ${req.user.band._id}`
        ),
        // band subgroup TOTALS
        client.query(
          sql`SELECT SUM(points) AS points FROM hit_note_game WHERE band_id = ${req.user.band._id} AND subgroup = ${req.user.subgroup}`
        ),
      ]);
    });
    console.log(results.map((obj, idx) => [idx, JSON.stringify(obj.value.rows)]));

    res.json({
      userPointsToday: results[0].value.rows[0]?.points || 0,
      bandPointsToday: results[1].value.rows[0]?.points || 0,
      groupPointsToday: results[2].value.rows[0]?.points || 0,
      userStreak:
        results[3].value.rows.length -
        results[3].value.rows
          .map(row => row.streak_status)
          .lastIndexOf('start'),
      bandStreak:
        results[4].value.rows.length -
        results[4].value.rows
          .map(row => row.streak_status)
          .lastIndexOf('start'),
      groupStreak:
        results[5].value.rows.length -
        results[5].value.rows
          .map(row => row.streak_status)
          .lastIndexOf('start'),
      userPointsTotal: results[6].value.rows[0]?.points || 0,
      bandPointsTotal: results[7].value.rows[0]?.points || 0,
      groupPointsTotal: results[8].value.rows[0]?.points || 0,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
}

// receives updates from client
export async function post(req, res, next) {
  try {
    const upsertResult = await env.slonik.connect(client => {
      return client.query(sql`
            INSERT INTO hit_note_game (
                user_id,
                band_id,
                subgroup,
                points
            )
            VALUES (
                ${req.user._id},
                ${req.user.band._id},
                ${req.user.subgroup},
                ${req.body.points}
            )
            ON CONFLICT ON CONSTRAINT note_sprint_game_user_id_band_id_date_key DO UPDATE
            SET points = EXCLUDED.points
        `);
    });
    console.log(upsertResult);
    res.end();
  } catch (err) {
    console.error(err);
    next(err);
  }
}
