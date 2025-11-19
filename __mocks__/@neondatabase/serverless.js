// In-memory mock of @neondatabase/serverless for unit tests.
// Supports a small subset of tagged-template queries used in tests.

const { parse } = require('date-fns');

function createMock() {
  const state = {
    players: [],
    matches: [],
    inactivity_exemptions: [],
    nextIds: { players: 1, matches: 1, inactivity_exemptions: 1 },
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

    // SELECT start_date, end_date FROM inactivity_exemptions WHERE player_id = ${}
    if (q.includes('from inactivity_exemptions') && q.includes('where player_id')) {
      const playerId = values[0];
      const rows = state.inactivity_exemptions.filter(r => r.player_id === playerId).map(r => ({ start_date: r.start_date, end_date: r.end_date }));
      return Promise.resolve(rows);
    }

    // INSERT INTO inactivity_exemptions (...) VALUES (${playerId}, ${reason}, ${sd}, ${ed}) RETURNING *
    if (q.includes('insert into inactivity_exemptions')) {
      // assume values order: player_id, reason, start_date, end_date
      const [player_id, reason, start_date, end_date] = values;
      const id = state.nextIds.inactivity_exemptions++;
      const row = { id, player_id, reason, start_date, end_date };
      state.inactivity_exemptions.push(row);
      return Promise.resolve([row]);
    }

    // DELETE FROM inactivity_exemptions WHERE id = ${id}
    if (q.includes('delete from inactivity_exemptions')) {
      const id = values[0];
      const before = state.inactivity_exemptions.length;
      state.inactivity_exemptions = state.inactivity_exemptions.filter(r => r.id !== id);
      return Promise.resolve([]);
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

