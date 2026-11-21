import { match } from '../domain/adt.ts';
import type { CopyOutcome } from '../domain/clipboard.ts';

async function copyText(value: string): Promise<CopyOutcome> {
  if (!value) {
    return { _tag: 'Failed', value, reason: 'empty' };
  }

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return { _tag: 'Copied', method: 'clipboard-api', value };
    } catch {
      // Fall through to selection-based fallback
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    const ok = document.execCommand('copy');
    return ok
      ? { _tag: 'Copied', method: 'legacy-fallback', value }
      : { _tag: 'Failed', value, reason: 'unsupported' };
  } catch {
    return { _tag: 'Failed', value, reason: 'unsupported' };
  } finally {
    textarea.remove();
  }
}

export function initCopyButtons(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-copy-button]');
  const liveRegion = document.querySelector<HTMLElement>('[data-copy-status]');

  for (const btn of buttons) {
    let resetTimer: number | undefined;
    const defaultText = btn.textContent?.trim() ?? '';

    btn.addEventListener('click', async () => {
      const targetValue = btn.dataset.copyValue ?? '';
      const outcome = await copyText(targetValue);

      const { feedback, copiedAttr } = match(outcome, {
        Copied: ({ value }) => ({
          feedback: btn.dataset.copiedLabel ?? 'Copied',
          copiedAttr: 'true',
          announcement: `${btn.dataset.copiedLabel ?? 'Copied'}: ${value}`,
        }),
        Failed: ({ value }) => ({
          feedback: btn.dataset.failedLabel ?? 'Copy unavailable',
          copiedAttr: 'false',
          announcement: `${btn.dataset.failedLabel ?? 'Copy unavailable'}: ${value}`,
        }),
      });

      btn.textContent = feedback;
      btn.setAttribute('data-copied', copiedAttr);

      if (liveRegion) {
        liveRegion.textContent = `${feedback}: ${targetValue}`;
      }

      if (resetTimer !== undefined) {
        window.clearTimeout(resetTimer);
      }
      resetTimer = window.setTimeout(() => {
        btn.textContent = defaultText;
        btn.removeAttribute('data-copied');
      }, 2000);
    });
  }
}

initCopyButtons();
