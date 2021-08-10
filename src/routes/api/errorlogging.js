import { slonik } from '../../config/environment';
import { sql } from 'slonik';
// receives client-side errors
export async function post(req, res, next) {
  await slonik.connect(client => {
    return client.query(sql`
            INSERT INTO errors_client (
                message,
                stack,
                ua,
                project,
                userid,
                url
            )
            VALUES (
                ${req.body.message},
                ${req.body.stack},
                ${req.body.ua},
                ${req.body.project},
                ${req.body.userid},
                ${req.body.url}
            )
        `);
  });
  res.json({status: 'ok'});
}
