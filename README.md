# embedbot

A simple, clean, **embeddable hair-salon receptionist chatbot** for appointment booking. Drop it into any website with a single `<script>` tag — no backend, no API keys, no dependencies.

The widget adds a floating chat button to the corner of the page. When opened, it runs a guided conversation that mirrors the questions a real salon receptionist asks while booking an appointment: service → stylist → day → time → name → phone → confirmation.

## Quick start

Add one line to any HTML page:

```html
<script
  src="dist/embedbot.js"
  data-salon="Bella Hair Studio"
  data-accent="#8b5cf6"
  data-services="Haircut, Cut & Blow-dry, Colour, Highlights, Balayage, Treatment"
  data-stylists="No preference, Ava, Marco, Priya"
  data-hours="Mon–Sat, 9am–6pm"></script>
```

That's it. The chatbot appears in the bottom-right corner of every page that includes the script.

## Configuration

Configure with `data-*` attributes on the script tag, or a global `window.EmbedBotConfig` object (which takes precedence).

| Option      | Attribute        | Description                                                        |
| ----------- | ---------------- | ----------------------------------------------------------------- |
| `salon`     | `data-salon`     | Salon name shown in the header and greeting.                      |
| `accent`    | `data-accent`    | Brand colour (any CSS colour) used across the widget.             |
| `services`  | `data-services`  | Comma-separated list of bookable services (quick-reply chips).    |
| `stylists`  | `data-stylists`  | Comma-separated list of stylists.                                 |
| `hours`     | `data-hours`     | Opening-hours label.                                              |
| `webhook`   | `data-webhook`   | Optional URL that receives the completed booking as JSON (POST).  |

### JavaScript API

```js
EmbedBot.open();   // open the chat panel
EmbedBot.close();  // close it
EmbedBot.config;   // resolved configuration

// Listen for completed bookings anywhere on the page:
window.addEventListener("embedbot:booking", (e) => {
  console.log("New booking:", e.detail);
});
```

## Development

Requires Node.js 18+.

```bash
npm install      # install esbuild
npm run dev      # dev server + live rebuild at http://localhost:8000
npm run build    # minified production bundle -> dist/embedbot.js
npm run watch    # rebuild on change (no server)
```

`index.html` is a demo hair-salon website ("Bella Hair Studio") that embeds the widget, so `npm run dev` shows the full end-to-end experience.

## How it works

- `src/embedbot.js` — the entire widget: injects its own styles + DOM, runs the booking state machine, and exposes the `EmbedBot` API.
- `index.html` — demo website that loads the built widget via a single script tag.
- Built with [esbuild](https://esbuild.github.io/) into a single self-contained file in `dist/`.

The booking flow is fully client-side and deterministic, so it works offline and on any static site. Supply a `data-webhook` URL (or listen for the `embedbot:booking` event) to forward completed bookings to your own booking system, CRM, or email service.
