import { upstashGet, upstashSet, upstashSAdd, upstashSMembers } from './_utils/redis.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    await getAttendance(req, res);
    return;
  }
  if (req.method === 'POST' || req.method === 'PUT') {
    await saveAttendance(req, res);
    return;
  }
  res.status(405).json({ error: 'Method not allowed' });
}

async function getAttendance(req, res) {
  try {
    const courseId = parseInt((req.query.courseId || '').toString(), 10);
    if (isNaN(courseId)) {
      res.status(400).json({ error: 'courseId required' });
      return;
    }
    let records = [];
    try {
      const indexKey = `attendance:index:${courseId}`;
      const dates = await upstashSMembers(indexKey);
      if (Array.isArray(dates) && dates.length > 0) {
        const jsons = await Promise.all(dates.map(d => upstashGet(`attendance:${courseId}:${d}`)));
        records = jsons.filter(Boolean).map(raw => JSON.parse(raw));
      }
    } catch (_) {}
    res.status(200).json({ records });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load attendance' });
  }
}

async function saveAttendance(req, res) {
  try {
    const body = await parseBody(req);
    const { course_id, date } = body || {};
    if (!course_id || !date) {
      res.status(400).json({ error: 'course_id and date required' });
      return;
    }
    const key = `attendance:${course_id}:${date}`;
    try {
      await upstashSet(key, body);
      await upstashSAdd(`attendance:index:${course_id}`, date);
      res.status(200).json({ ok: true });
      return;
    } catch (e) {
      res.status(500).json({ error: 'Failed to save attendance' });
      return;
    }
  } catch (e) {
    res.status(500).json({ error: 'Invalid request' });
  }
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf-8');
  try { return JSON.parse(raw); } catch { return {}; }
}


