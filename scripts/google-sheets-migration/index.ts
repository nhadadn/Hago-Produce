import { runMigration, MigrationOptions } from './migrator';

function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'si', 'sí', 'y'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  return defaultValue;
}

function parseNumberEnv(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const num = Number(value);
  if (Number.isNaN(num) || num <= 0) return defaultValue;
  return num;
}

async function main(): Promise<void> {
  const options: MigrationOptions = {
    dryRun: parseBooleanEnv(process.env.MIGRATION_DRY_RUN, true),
    batchSize: parseNumberEnv(process.env.MIGRATION_BATCH_SIZE, 100),
    skipExisting: parseBooleanEnv(process.env.MIGRATION_SKIP_EXISTING, false),
  };

  const result = await runMigration(options);

  if (result.errors > 0) {
    process.exitCode = 1;
  }
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[MIGRATION_FATAL_ERROR]', error);
  process.exitCode = 1;
});

