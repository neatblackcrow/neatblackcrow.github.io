export function initPrintTriggers(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-print-trigger]');
  for (const btn of buttons) {
    btn.addEventListener('click', () => {
      window.print();
    });
  }
}

initPrintTriggers();
