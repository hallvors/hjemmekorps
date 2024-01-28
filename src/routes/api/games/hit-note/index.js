const { sql } = require('slonik');
import * as env from '../../../../config/environment';
import {
  getHitNoteStatsForAdmin,
  getHitNoteStatsForMember,
} from '../../../../lib/db-queries';

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
    const statsForMembers = req.user._type === 'member';
    const bandId = statsForMembers ? req.user.band._id : req.query.band;
    const results = statsForMembers
      ? await getHitNoteStatsForMember(bandId, req.user._id, req.user.subgroup)
      : await getHitNoteStatsForAdmin(bandId);

    res.json(results);
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
