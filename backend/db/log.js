const db = require('./index');

const insertLog = db.prepare(`
  INSERT INTO logs (item_id, action, details, user_id, created_at)
  VALUES (@item_id, @action, @details, @user_id, @created_at)
`);

/**
 * Record an audit-trail entry for a warehouse process.
 * @param {object} p
 * @param {number|null} p.item_id
 * @param {string} p.action - short machine-readable action code, e.g. 'INBOUND_RECEIVED'
 * @param {string} [p.details] - human-readable detail string
 * @param {string} p.user_id
 * @param {string} [p.created_at] - ISO datetime, defaults to now
 */
function addLog({ item_id = null, action, details = '', user_id, created_at }) {
  insertLog.run({
    item_id,
    action,
    details,
    user_id,
    created_at: created_at || new Date().toISOString(),
  });
}

module.exports = { addLog };
