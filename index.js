const app = require('./server');
const env = require('./config/environment');

app.listen(env.port, () => console.log(`Server running on port ${PORT}`));
