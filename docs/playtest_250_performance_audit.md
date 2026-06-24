# Playtest 250 Performance Audit

Date: 2026-06-24

## Route timings

- /decks/5f09f158-cd16-446d-ad11-3c3fea7760ac: 4855ms
- /matchups: 2064ms
- /matchups: 1830ms
- /matches?page=2: 1503ms
- /matches: 1197ms
- /matches: 1188ms
- /review: 1049ms
- /decks/5f09f158-cd16-446d-ad11-3c3fea7760ac: 1046ms
- /matches/new: 994ms
- /review: 972ms
- /review: 935ms
- /decks: 821ms
- /: 817ms
- /decks: 768ms
- /matches/new: 768ms
- /dashboard: 744ms
- /matches/new: 740ms
- /profile: 707ms
- /dashboard: 702ms
- /profile: 676ms
- /dashboard: 666ms
- /demo: 604ms
- /u/domz_test: 0ms

## Notes

- Flag anything above roughly 4000-5000ms locally as a should-fix.
- /matches should stay paginated at 250 logs.
- /settings/profile should remain light even after the richer preview builder.

## Console errors

- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=Ft-UjmGYpfhbSVBXpUBi1' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=Ft-UjmGYpfhbSVBXpUBi1' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6Z3CNI9w_vrXWvuf_0tZE' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6Z3CNI9w_vrXWvuf_0tZE' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=A9HcWC6plKycQWDjqOVbY' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=KJy4QTBs30VM_FHF5OOAB' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6Z3CNI9w_vrXWvuf_0tZE' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=mqh-ZULn8L_Z620scBC25' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6Z3CNI9w_vrXWvuf_0tZE' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=mqh-ZULn8L_Z620scBC25' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6Z3CNI9w_vrXWvuf_0tZE' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=2sxbOfclW6zoPhcDNTdoM' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6Z3CNI9w_vrXWvuf_0tZE' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=2sxbOfclW6zoPhcDNTdoM' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=2sxbOfclW6zoPhcDNTdoM' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=zQtOVgC-_NEVHtR43Pi_8' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=zQtOVgC-_NEVHtR43Pi_8' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=zQtOVgC-_NEVHtR43Pi_8' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=zlv7o5k3OHbySpJVcZ-HJ' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6Z3CNI9w_vrXWvuf_0tZE' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=zlv7o5k3OHbySpJVcZ-HJ' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=vaOI0v0fdvD4Rdmv1QXgk' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=vaOI0v0fdvD4Rdmv1QXgk' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6Z3CNI9w_vrXWvuf_0tZE' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6Z3CNI9w_vrXWvuf_0tZE' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=fod6FDet0fkmWam_LCSyr' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6Z3CNI9w_vrXWvuf_0tZE' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6Z3CNI9w_vrXWvuf_0tZE' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=nq7Je0HIejtE-JFS0z682' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=nq7Je0HIejtE-JFS0z682' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=7fgGhSfNLTOY3jp8y5q1a' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=_wkdvpuf-ZhIvEjzDAPzM' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=FiKhiHyOdUGHvDnFIIaC2' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=QR7VW3UZ01dDWYwqohF4F' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=Rv43HClP0Y_HWlpr9GRuY' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=uEUn3Nvw3zwxhX9Y0a7LW' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=0Iy4zsOoxP-drDWG7Z_1k' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=c1VKAoK1yrgsGOIJOdgXc' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=jY9fP25GjUDhBFvxtfVnm' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=7xfIi-rjfHg83U3jKbd_J' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=2PBlPe9OX-yGNuxVT5nqg' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=jbgWqyJjZJ5X_HWUZMmaz' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=jnp1xLS56fCcgH-rbgQxe' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=CKT-_Bh7t-RT1XVgYx12q' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=7xfIi-rjfHg83U3jKbd_J' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=CKT-_Bh7t-RT1XVgYx12q' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=pvGTEfp0xYcA6ezgX2yuO' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=jbgWqyJjZJ5X_HWUZMmaz' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=pvGTEfp0xYcA6ezgX2yuO' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=pvGTEfp0xYcA6ezgX2yuO' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=8z8jexDn543uoCBbS5iGH' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=8z8jexDn543uoCBbS5iGH' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=soJVP4VJwsx1kXinx-xkb' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=7xfIi-rjfHg83U3jKbd_J' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=jbgWqyJjZJ5X_HWUZMmaz' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=soJVP4VJwsx1kXinx-xkb' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=OyA2hk42xlS6CWX2YHvzG' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=7xfIi-rjfHg83U3jKbd_J' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=jbgWqyJjZJ5X_HWUZMmaz' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=FoOWYTTZ9v08Jlqw2-9UR' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=hxRtki6rl2ATyuWa59s9C' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=M5VXD2Z7JwVojsKUMqFPt' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=M5VXD2Z7JwVojsKUMqFPt' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=Ux92_drQ6Abf1pyIcVQtC' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=7xfIi-rjfHg83U3jKbd_J' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=jbgWqyJjZJ5X_HWUZMmaz' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=2Y3441Mcsfxh1hQlt24ZI' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=sT0AtK3CVLAyDfuuv9Ftq' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=sT0AtK3CVLAyDfuuv9Ftq' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
