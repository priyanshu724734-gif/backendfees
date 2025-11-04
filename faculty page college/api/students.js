import { upstashGet } from './_utils/redis.js';
import fs from 'fs/promises';
import path from 'path';

export default async function handler(_req, res) {
  if (_req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    let students = [];
    try {
      const raw = await upstashGet('students:all');
      if (raw) students = JSON.parse(raw);
    } catch (_) {}

    if (students.length === 0) {
      const dataPath = path.join(process.cwd(), 'database', 'students.json');
      const text = await fs.readFile(dataPath, 'utf-8');
      students = JSON.parse(text);
    }
    res.status(200).json({ students });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load students' });
  }
}


