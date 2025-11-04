import { upstashGet } from './_utils/redis.js';
import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { email, password } = await parseBody(req);
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    let profile = null;
    try {
      const raw = await upstashGet(`faculty:${email}`);
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj.password === password) {
          const { password: _pw, ...safe } = obj;
          profile = safe;
        }
      }
    } catch (_) {}

    if (!profile) {
      const dataPath = path.join(process.cwd(), 'database', 'faculty.json');
      const text = await fs.readFile(dataPath, 'utf-8');
      const list = JSON.parse(text);
      const user = list.find(f => f.email === email && f.password === password);
      if (user) {
        const { password: _pw, ...safe } = user;
        profile = safe;
      }
    }

    if (!profile) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    res.status(200).json({ profile });
  } catch (e) {
    res.status(500).json({ error: 'Login failed' });
  }
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf-8');
  try { return JSON.parse(raw); } catch { return {}; }
}


