import { upstashGet } from './_utils/redis.js';
import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const idsParam = (req.query.ids || '').toString();
    const ids = idsParam.split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n));
    let courses = [];

    try {
      if (ids.length > 0) {
        const fetched = await Promise.all(ids.map(async (id) => {
          const raw = await upstashGet(`course:${id}`);
          return raw ? JSON.parse(raw) : null;
        }));
        courses = fetched.filter(Boolean);
      }
    } catch (_) {}

    if (courses.length === 0) {
      const dataPath = path.join(process.cwd(), 'database', 'courses.json');
      const text = await fs.readFile(dataPath, 'utf-8');
      const list = JSON.parse(text);
      courses = ids.length ? list.filter(c => ids.includes(c.id)) : list;
    }

    res.status(200).json({ courses });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load courses' });
  }
}


