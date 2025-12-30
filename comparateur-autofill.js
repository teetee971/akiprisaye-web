(function () {
  function getEANFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const ean = params.get('ean');
    return ean && (/^\d{13}$|^\d{8}$/.test(ean)) ? ean : null;
  }
  const ean = getEANFromQuery();
  if (!ean) return;

  const input = document.getElementById('ean-input');
  const form = document.getElementById('comparateur-form');
  if (input) input.value = ean;

  if (form && typeof form.requestSubmit === 'function') {
    form.requestSubmit();
  } else if (form) {
    form.submit();
  }
})();
