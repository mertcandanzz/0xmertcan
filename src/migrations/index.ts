import * as migration_20261020_022238_initial from './20261020_022238_initial';
import * as migration_20261020_100100_hero_background from './20261020_100100_hero_background';
import * as migration_20261020_121855_github from './20261020_121855_github';

export const migrations = [
  {
    up: migration_20261020_022238_initial.up,
    down: migration_20261020_022238_initial.down,
    name: '20261020_022238_initial',
  },
  {
    up: migration_20261020_100100_hero_background.up,
    down: migration_20261020_100100_hero_background.down,
    name: '20261020_100100_hero_background',
  },
  {
    up: migration_20261020_121855_github.up,
    down: migration_20261020_121855_github.down,
    name: '20261020_121855_github'
  },
];
