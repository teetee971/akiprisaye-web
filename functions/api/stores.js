export const onRequest = async ({ request }) => {
  const url = new URL(request.url);
  const territory = (url.searchParams.get('territory') || '').toUpperCase();
  const stores = await fetch(new URL('../../public/data/stores.json', import.meta.url)).then(r=>r.json());
  const body = territory && stores[territory] ? { territory, stores: stores[territory] }
                                              : { error: 'unknown_territory', territory };
  return new Response(JSON.stringify(body), {
    headers: { 'content-type':'application/json; charset=utf-8',
               'cache-control':'no-store' }
  });
};
