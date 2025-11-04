export async function upstashExec(commands) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error('Upstash Redis env not configured');
  }
  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ commands })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upstash error: ${res.status} ${text}`);
  }
  return res.json();
}

export async function upstashGet(key) {
  const [result] = await upstashExec([["GET", key]]);
  return result.result ?? null;
}

export async function upstashSet(key, value) {
  const payload = typeof value === 'string' ? value : JSON.stringify(value);
  await upstashExec([["SET", key, payload]]);
  return true;
}

export async function upstashSAdd(key, member) {
  await upstashExec([["SADD", key, member]]);
  return true;
}

export async function upstashSMembers(key) {
  const [result] = await upstashExec([["SMEMBERS", key]]);
  return result.result || [];
}


