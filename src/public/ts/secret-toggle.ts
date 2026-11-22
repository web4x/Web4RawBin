// Show/hide toggle for secret-code inputs (masked by default, 👁 button reveals).
export function bindSecretToggle(inputId: string, toggleId: string): void {
  const input = document.getElementById(inputId) as HTMLInputElement | null;
  const toggle = document.getElementById(toggleId) as HTMLButtonElement | null;
  if (!input || !toggle) return;
  toggle.addEventListener('click', () => {
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    toggle.setAttribute('aria-pressed', String(show));
    toggle.setAttribute('aria-label', show ? 'Hide secret code' : 'Show secret code');
    toggle.textContent = show ? '🙈' : '👁';
    input.focus();
  });
}
