export function logPerfStats(data) {
  // log async to not interfere too much with
  // whatever is going on in the app (could also
  // be done in a worker..some day)
  setTimeout(function () {
    if (!('measurement' in data && 'ms' in data && 'project' in data)) {
      console.error(data)
      throw new Error('incomplete data for perf stats');
    }
    fetch('/api/perflogging', {
      method: 'POST',
      credentials: 'same-origin',
      body: JSON.stringify({
        measurement: data.measurement,
        ua: navigator.userAgent,
        project: data.project,
        userid: data.userid || '',
        ms: data.ms,
      }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }).catch(err => console.error(err));
  }, 350);
}
