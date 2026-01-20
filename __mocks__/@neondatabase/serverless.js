// In-memory mock of @neondatabase/serverless for unit tests.
// Supports a small subset of tagged-template queries used in tests.

const { parse } = require('date-fns');

function createMock() {
  const state = {
    players: [],
    matches: [],
    nextIds: { players: 1, matches: 1 },
  };

  function sql(strings, ...values) {
    const raw = strings.join('');
    const q = raw.toLowerCase();

    // SELECT * FROM players
    if (q.includes('select * from players')) {
      return Promise.resolve(state.players.slice());
    }

    // SELECT * FROM matches ... LIMIT
    if (q.includes('select * from matches')) {
      // simple handling for limit
      const limitMatch = q.match(/limit\s+\$?\{?(\d+)\}?/);
      if (limitMatch) {
        const n = Number(limitMatch[1]);
        return Promise.resolve(state.matches.slice(0, n));
      }

      // date range
      const betweenMatch = q.match(/where\s+date\s*>=[\s\S]*and\s+date\s*<=/);
      if (betweenMatch && values.length >= 2) {
        const start = new Date(values[0]);
        const end = new Date(values[1]);
        const filtered = state.matches.filter(m => {
          const d = new Date(m.date);
          return d >= start && d <= end;
        });
        return Promise.resolve(filtered);
      }

      return Promise.resolve(state.matches.slice());
    }

    // generic fallback
    return Promise.resolve([]);
  }

  sql.transaction = async function (cb) {
    // Simple transaction shim: execute callback with sql; ignore commit/rollback
    return cb(sql);
  };

  // helpers to seed state in tests if needed
  sql.__state = state;

  return sql;
}

module.exports = { neon: () => createMock() };

