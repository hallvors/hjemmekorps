const {sql} = require('slonik');
async function logServerSideError(slonik, message, stack) {
  await slonik.connect(client => {
    return client.query(sql`
            INSERT INTO errors_server (
                message,
                stack,
            )
            VALUES (
                ${message},
                ${stack}
            )
        `);
  });
}

async function logClientSideError(slonik, req) {
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
}

module.exports = {
  logClientSideError,
  logServerSideError,
};
