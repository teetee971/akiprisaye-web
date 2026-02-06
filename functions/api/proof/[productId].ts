export async function onRequestGet(context: any) {
  const { productId } = context.params;

  try {
    const proofUrl = new URL(
      '/data/price-proof-index.json',
      context.request.url
    );

    const res = await fetch(proofUrl.toString());

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: 'Proof dataset unavailable' }),
        { status: 500 }
      );
    }

    const data = await res.json();
    const proof = data.products?.[productId];

    if (!proof) {
      return new Response(
        JSON.stringify({
          productId,
          verified: false,
          reason: 'No proof available'
        }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        productId,
        verified: proof.verified,
        ticketsCount: proof.ticketsCount,
        lastObservedAt: proof.lastObservedAt,
        confidenceLevel: proof.confidenceLevel
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300'
        }
      }
    );

  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'Unexpected server error' }),
      { status: 500 }
    );
  }
}