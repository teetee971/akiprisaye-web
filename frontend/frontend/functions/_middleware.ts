export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "https://teetee971.github.io",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};

export const onRequest: PagesFunction = async ({ next }) => {
  const response = await next();
  response.headers.set("Access-Control-Allow-Origin", "https://teetee971.github.io");
  return response;
};
