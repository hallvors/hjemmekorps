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

async function logClientSideError(slonik, data) {
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
                ${data.message},
                ${data.stack},
                ${data.ua},
                ${data.project},
                ${data.userid},
                ${data.url}
            )
        `);
  });
}

async function logPerformanceData(slonik, data) {
  await slonik.connect(client => {
    return client.query(sql`
            INSERT INTO perf_stats (
                measurement,
                ua,
                project,
                userid,
                ms
            )
            VALUES (
                ${data.measurement},
                ${data.ua},
                ${data.project},
                ${data.userid},
                ${data.ms}
            )
        `);
  });
}

module.exports = {
  logClientSideError,
  logServerSideError,
  logPerformanceData,
};
