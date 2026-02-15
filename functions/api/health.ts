export const onRequestGet: PagesFunction = async () => {
  return new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
};
