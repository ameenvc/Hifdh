const paths = {
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/>',
  play: '<path d="m8 4 12 8-12 8z"/>',
  stop: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
  bookmark: '<path d="M6 3h12v19l-6-4-6 4z"/>',
  settings:
    '<path d="m9 3-1 3-3 1 1 4-2 2 2 3 3-1 3 2 3-2 3 1 2-3-2-2 1-4-3-1-1-3z"/><circle cx="12" cy="10" r="3"/>',
  expand: '<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>',
  collapse: '<path d="M3 8h5V3M21 8h-5V3M3 16h5v5M21 16h-5v5"/>',
  sound:
    '<path d="M11 4 6 8H2v8h4l5 4zM15 8a6 6 0 0 1 0 8M18 4a11 11 0 0 1 0 16"/>',
  arrowLeft: '<path d="m14 5-7 7 7 7M7 12h14"/>',
  arrowRight: '<path d="m10 5 7 7-7 7M3 12h14"/>',
  hint: '<path d="M9 18h6M10 22h4M8 14a7 7 0 1 1 8 0l-1 2H9z"/>',
  retry: '<path d="M3 10a9 9 0 1 1 2 9M3 4v6h6"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
};
export function icon(name) {
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.check}</svg>`;
}
