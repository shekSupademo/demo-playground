// Where Settings → Integrations loads its embedded page from. The page is a
// same-origin static file in public/, so the app and the frame share an origin.
// Change these values to move, rename or delay the frame.
export const INTEGRATIONS_FRAME = {
  // The outer frame loads a wrapper page whose own iframe (title "Integration list",
  // name integrations-list) loads the rows page, ./integrations/index.html.
  src: "./integrations/wrapper.html",
  title: "Integrations",
  name: "integrations",
  // Milliseconds to wait before the frame is added to the page. 0 adds it at once.
  loadDelayMs: 0,
};
