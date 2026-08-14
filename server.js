// Backend do ProPath Futebol — Node + Express + SQLite (nativo node:sqlite)
// Servidor local: serve o protótipo e persiste os saves em SQLite (várias carreiras).
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const ROOT = __dirname;
const DB_PATH = process.env.DB_PATH || path.join(ROOT, 'carreira.db');
const PORT = process.env.PORT || 4321;

// ---------- SQLite ----------
const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS saves (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    owner TEXT NOT NULL DEFAULT '',
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    pass TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    team TEXT NOT NULL DEFAULT '',
    ovr INTEGER NOT NULL,
    trophies INTEGER NOT NULL DEFAULT 0,
    season INTEGER NOT NULL DEFAULT 1,
    updated_at INTEGER NOT NULL
  );
`);

// migration idempotente: garante coluna owner nos saves (bancos antigos)
try {
  db.exec("ALTER TABLE saves ADD COLUMN owner TEXT NOT NULL DEFAULT ''");
} catch (e) { /* coluna já existe — ok */ }

// ---------- Senhas (hash scrypt + salt, nunca plaintext) ----------
function hashPassword(pass) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(pass), salt, 64).toString('hex');
  return `${salt}:${derived}`;
}
function verifyPassword(pass, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, derived] = stored.split(':');
  const check = crypto.scryptSync(String(pass), salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(check, 'hex'), Buffer.from(derived, 'hex'));
}

// ---------- Express ----------
const app = express();
app.use(express.json({ limit: '8mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  next();
});
app.use((req, res, next) => { if (req.method === 'OPTIONS') return res.sendStatus(204); next(); });

// serve os arquivos estáticos (index.html, etc.)
app.use(express.static(ROOT, { index: 'index.html' }));

// ---------- API de saves (várias carreiras) ----------
// owner: '' = órfão (visível a todos, ainda não reivindicado); 'contaId' = dono logado
app.get('/api/saves', (req, res) => {
  try {
    const owner = req.query.owner || '';
    let rows;
    if (owner) {
      // só os saves do dono + os ainda órfãos (para ele poder reivindicar)
      rows = db.prepare("SELECT id, data, owner, updated_at FROM saves WHERE owner = ? OR owner = '' ORDER BY updated_at DESC").all(owner);
    } else {
      rows = db.prepare('SELECT id, data, owner, updated_at FROM saves ORDER BY updated_at DESC').all();
    }
    const list = rows.map(r => {
      let name = '', team = '', tier = '', season = '';
      try {
        const d = JSON.parse(r.data);
        name = d.name || '';
        team = d.teamName || '';
        tier = d.tierIndex != null ? ('T' + (d.tierIndex + 1)) : '';
        season = d.season || '';
      } catch (e) {}
      return { id: r.id, owner: r.owner || '', updated_at: r.updated_at, name, team, southern: tier, season };
    });
    res.json(list);
  } catch (e) { res.status(500).json({ error: 'Erro ao listar saves: ' + String(e) }); }
});

app.get('/api/save/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT data FROM saves WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Save não encontrado' });
    res.json(JSON.parse(row.data));
  } catch (e) { res.status(500).json({ error: 'Erro ao carregar save: ' + String(e) }); }
});

app.post('/api/save/:id', (req, res) => {
  try {
    const id = req.params.id;
    const data = JSON.stringify(req.body);
    const owner = (req.body && req.body.owner) || '';
    const now = Date.now();
    db.prepare(`INSERT INTO saves (id, data, owner, updated_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET data = excluded.data, owner = excluded.owner, updated_at = excluded.updated_at`).run(id, data, owner, now);
    res.json({ ok: true, id, owner, updated_at: now });
  } catch (e) { res.status(500).json({ error: 'Erro ao salvar: ' + String(e) }); }
});

// Reivindicar (assumir posse) de um save órfão. Só órfãos (owner='') podem ser reivindicados.
app.post('/api/save/:id/claim', (req, res) => {
  try {
    const id = req.params.id;
    const owner = (req.body && req.body.owner) || '';
    if (!owner) return res.status(400).json({ error: 'owner obrigatório' });
    const row = db.prepare('SELECT owner FROM saves WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ error: 'Save não encontrado' });
    if (row.owner && row.owner !== owner) return res.status(409).json({ error: 'Este save já pertence a outra conta' });
    db.prepare('UPDATE saves SET owner = ? WHERE id = ?').run(owner, id);
    res.json({ ok: true, id, owner });
  } catch (e) { res.status(500).json({ error: 'Erro ao reivindicar save: ' + String(e) }); }
});

app.delete('/api/save/:id', (req, res) => {
  try {
    const owner = req.query.owner || '';
    if (owner) {
      const row = db.prepare('SELECT owner FROM saves WHERE id = ?').get(req.params.id);
      if (row && row.owner && row.owner !== owner) return res.status(403).json({ error: 'Não é dono deste save' });
    }
    db.prepare('DELETE FROM saves WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Erro ao apagar save: ' + String(e) }); }
});

// leaderboard (modo online — precisa de servidor hospedado)
app.get('/api/leaderboard', (req, res) => {
  try {
    const rows = db.prepare('SELECT name, team, ovr, trophies, season FROM leaderboard ORDER BY ovr DESC, trophies DESC LIMIT 50').all();
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Erro ao carregar leaderboard: ' + String(e) }); }
});
app.post('/api/leaderboard', (req, res) => {
  try {
    const { name, team, ovr, trophies, season } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Nome obrigatório' });
    const now = Date.now();
    db.prepare('INSERT INTO leaderboard (name, team, ovr, trophies, season, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(String(name), String(team || ''), Number(ovr) || 0, Number(trophies) || 0, Number(season) || 1, now);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Erro ao salvar leaderboard: ' + String(e) }); }
});

// contas (modo online — estrutura pronta para deploy)
app.post('/api/account', (req, res) => {
  try {
    const { id, name, pass } = req.body || {};
    if (!id || !name) return res.status(400).json({ error: 'id e name obrigatórios' });
    const now = Date.now();
    const passHash = pass ? hashPassword(pass) : '';
    db.prepare('INSERT INTO accounts (id, name, pass, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name')
      .run(String(id), String(name), passHash, now);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Erro ao criar conta: ' + String(e) }); }
});

// login (modo online — verifica hash, nunca compara plaintext)
app.post('/api/login', (req, res) => {
  try {
    const { id, pass } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id obrigatório' });
    const row = db.prepare('SELECT id, name, pass FROM accounts WHERE id = ?').get(String(id));
    if (!row) return res.status(404).json({ error: 'Conta não encontrada' });
    if (!verifyPassword(pass || '', row.pass)) return res.status(401).json({ error: 'Senha incorreta' });
    res.json({ ok: true, id: row.id, name: row.name });
  } catch (e) { res.status(500).json({ error: 'Erro ao autenticar: ' + String(e) }); }
});

// healthcheck
app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now(), game: 'futebol' }));

app.listen(PORT, () => {
  console.log(`ProPath Futebol rodando em http://localhost:${PORT}`);
  console.log(`Banco SQLite: ${DB_PATH}`);
});

process.on('SIGINT', () => { db.close(); process.exit(0); });
process.on('SIGTERM', () => { db.close(); process.exit(0); });

module.exports = app;
