import { del, get, put } from '@vercel/blob';

const json = (status, payload) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });

const sanitizeUserKey = (value) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-');

  return normalized || 'default';
};

const getPathname = (userKey) => `kpi-data/${sanitizeUserKey(userKey)}.json`;

const handleGet = async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const userKey = sanitizeUserKey(searchParams.get('userKey'));
    const pathname = getPathname(userKey);

    const result = await get(pathname, { access: 'private' });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return json(200, { ok: true, payload: null, message: 'Data cloud belum ada.' });
    }

    const payloadText = await new Response(result.stream).text();
    const payload = JSON.parse(payloadText);

    return json(200, {
      ok: true,
      payload,
      message: 'Data cloud berhasil dimuat.'
    });
  } catch (error) {
    return json(500, {
      ok: false,
      message: error?.message || 'Gagal memuat data dari Vercel Blob.'
    });
  }
};

const handlePost = async (request) => {
  try {
    const payload = await request.json();
    const userKey = sanitizeUserKey(payload?.userKey);
    const pathname = getPathname(userKey);

    const normalizedPayload = {
      ...payload,
      userKey,
      savedAt: new Date().toISOString()
    };

    await put(pathname, JSON.stringify(normalizedPayload, null, 2), {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60
    });

    return json(200, {
      ok: true,
      message: 'Data cloud berhasil disimpan.',
      userKey
    });
  } catch (error) {
    return json(500, {
      ok: false,
      message: error?.message || 'Gagal menyimpan data ke Vercel Blob.'
    });
  }
};

const handleDelete = async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const userKey = sanitizeUserKey(searchParams.get('userKey'));
    const pathname = getPathname(userKey);

    await del(pathname);

    return json(200, {
      ok: true,
      message: 'Data cloud berhasil dihapus.',
      userKey
    });
  } catch (error) {
    return json(500, {
      ok: false,
      message: error?.message || 'Gagal menghapus data dari Vercel Blob.'
    });
  }
};

export default {
  async fetch(request) {
    if (request.method === 'GET') return handleGet(request);
    if (request.method === 'POST') return handlePost(request);
    if (request.method === 'DELETE') return handleDelete(request);

    return json(405, {
      ok: false,
      message: 'Method not allowed.'
    });
  }
};
