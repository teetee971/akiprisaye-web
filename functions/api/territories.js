export const onRequest = async () => {
  const data = await fetch(new URL('../../public/data/territories.json', import.meta.url)).then(r=>r.json());
  return new Response(JSON.stringify({ territories: data }), {
    headers: { 'content-type':'application/json; charset=utf-8',
               'cache-control':'public, max-age=3600' }
  });
};
