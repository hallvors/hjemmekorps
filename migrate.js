const { SlonikMigrator } = require('@slonik/migrator');
const { slonik } = require('./src/config/environment');

const migrator = new SlonikMigrator({
  migrationsPath: __dirname + '/migrations',
  migrationTableName: 'migration',
  slonik,
});
console.log(
  'Running migrations for ' +
    (process.env.DATABASE_URL || '').replace(/\/.*@/, '/*******:*******@')
);
migrator.runAsCLI();
