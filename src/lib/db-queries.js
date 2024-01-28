const env = require('../config/environment');
const { sql } = require('slonik');

async function getHitNoteStatsForMember(bandId, memberId, subgroup) {
  return await env.slonik.connect(async client => {
    const results = await Promise.allSettled([
      // user TODAY
      client.query(
        sql`SELECT points FROM hit_note_game WHERE user_id = ${memberId} AND date = CURRENT_DATE`
      ),
      // band TODAY
      client.query(
        sql`SELECT SUM(points) as points FROM hit_note_game WHERE band_id = ${bandId} AND date = CURRENT_DATE`
      ),
      // band subgroup TODAY
      client.query(
        sql`SELECT SUM(points) as points FROM hit_note_game WHERE band_id = ${bandId} AND subgroup = ${subgroup} AND date = CURRENT_DATE`
      ),
      // raw data for user STREAK
      client.query(sql`WITH date_with_prev AS (
        SELECT
          date,
          LAG(date) OVER (ORDER BY date) AS prev_date
        FROM
          hit_note_game
        WHERE user_id = ${memberId}
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
        WHERE band_id = ${bandId}
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
        WHERE band_id = ${bandId} AND subgroup = ${subgroup}
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
        sql`SELECT SUM(points) AS points FROM hit_note_game WHERE user_id = ${memberId}`
      ),
      // band TOTALS
      client.query(
        sql`SELECT SUM(points) AS points FROM hit_note_game WHERE band_id = ${bandId}`
      ),
      // band subgroup TOTALS
      client.query(
        sql`SELECT SUM(points) AS points FROM hit_note_game WHERE band_id = ${bandId} AND subgroup = ${subgroup}`
      ),
    ]);
    return {
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
          .map(row_1 => row_1.streak_status)
          .lastIndexOf('start'),
      groupStreak:
        results[5].value.rows.length -
        results[5].value.rows
          .map(row_2 => row_2.streak_status)
          .lastIndexOf('start'),
      userPointsTotal: results[6].value.rows[0]?.points || 0,
      bandPointsTotal: results[7].value.rows[0]?.points || 0,
      groupPointsTotal: results[8].value.rows[0]?.points || 0,
    };
  });
}

async function getHitNoteStatsForAdmin(bandId) {
  return await env.slonik.connect(async client => {
    const groups = await client.query(
      sql`SELECT DISTINCT subgroup FROM hit_note_game WHERE band_id = ${bandId}`
    );
    const results = await Promise.allSettled([
      // users TODAY
      client.query(
        sql`SELECT sum(points) as points, user_id FROM hit_note_game WHERE band_id = ${bandId} AND date = CURRENT_DATE GROUP BY user_id`
      ),
      // band TODAY
      client.query(
        sql`SELECT SUM(points) as points FROM hit_note_game WHERE band_id = ${bandId} AND date = CURRENT_DATE`
      ),
      // band subgroups TODAY
      client.query(
        sql`SELECT SUM(points)as points, subgroup  FROM hit_note_game WHERE band_id = ${bandId} AND date = CURRENT_DATE GROUP BY subgroup`
      ),
      // raw data for band STREAK
      client.query(sql`WITH date_with_prev AS (
        SELECT
          date,
          LAG(date) OVER (ORDER BY date) AS prev_date
        FROM
          hit_note_game
        WHERE band_id = ${bandId}
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
      Promise.all(
        groups.rows.map(entry => {
          return client.query(sql`WITH date_with_prev AS (
        SELECT
          date,
          subgroup,
          LAG(date) OVER (ORDER BY date) AS prev_date
        FROM
          hit_note_game
        WHERE band_id = ${bandId} AND subgroup = ${entry.subgroup}
      )
      SELECT
        date,
        prev_date,
        subgroup,
        date - prev_date AS diff,
        CASE
          WHEN date - prev_date = 1 THEN 'streak'
          WHEN date - prev_date > 1 THEN 'start'
          WHEN prev_date IS NULL THEN 'start'
          ELSE 'end'
        END AS streak_status
      FROM
        date_with_prev;
      `);
        })
      ),
      // user TOTALS
      client.query(
        sql`SELECT SUM(points)AS points, user_id  FROM hit_note_game GROUP BY user_id`
      ),
      // band TOTALS
      client.query(
        sql`SELECT SUM(points) AS points FROM hit_note_game WHERE band_id = ${bandId}`
      ),
      // band subgroup TOTALS
      client.query(
        sql`SELECT SUM(points) AS points, subgroup FROM hit_note_game WHERE band_id = ${bandId} GROUP BY subgroup`
      ),
    ]);
    console.log(JSON.stringify(results[3], null, 5));
    console.log(JSON.stringify(results[4], null, 5));
    return {
      userPointsToday: results[0].value.rows || [],
      bandPointsToday: results[1].value.rows[0]?.points || 0,
      groupPointsToday: results[2].value.rows || [],
      bandStreak:
        results[3].value.rows.length -
        results[3].value.rows
          .map(row => row.streak_status)
          .lastIndexOf('start'),
      groupStreak:
        results[4].value?.map(groupValue => ({
          streak:
            groupValue.rows.length -
            groupValue.rows
              .map(row_1 => row_1.streak_status)
              .lastIndexOf('start'),
          subgroup: groupValue.rows[0].subgroup,
        })) || [],
      userPointsTotal: results[5].value.rows || [],
      bandPointsTotal: results[6].value.rows[0]?.points || 0,
      groupPointsTotal: results[7].value.rows || [],
    };
  });
}

module.exports = {
  getHitNoteStatsForMember,
  getHitNoteStatsForAdmin,
};
