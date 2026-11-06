(() => {
  const button = document.querySelector('#show-sample');
  const report = document.querySelector('#sample-report');
  if (!button || !report) return;
  button.addEventListener('click', () => {
    const willOpen = report.hidden;
    report.hidden = !willOpen;
    button.setAttribute('aria-expanded', String(willOpen));
    button.innerHTML = willOpen
      ? 'Hide sample report <span aria-hidden="true">−</span>'
      : 'Reveal sample report <span aria-hidden="true">＋</span>';
  });
})();
