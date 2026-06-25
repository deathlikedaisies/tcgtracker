# Playtest 250 Performance Audit

Date: 2026-06-25

## Route timings

- /decks/cfeab7be-c4c9-4bdd-a802-31946e5e668e: 4279ms
- /matchups: 2186ms
- /review: 2001ms
- /matches: 1974ms
- /: 1883ms
- /matchups: 1799ms
- /decks: 1478ms
- /matches?page=2: 1284ms
- /matches/new: 1264ms
- /matches: 1107ms
- /demo: 1049ms
- /decks/cfeab7be-c4c9-4bdd-a802-31946e5e668e: 989ms
- /review: 962ms
- /review: 919ms
- /profile: 880ms
- /profile: 879ms
- /decks: 843ms
- /matches/new: 772ms
- /dashboard: 701ms
- /dashboard: 685ms
- /matches/new: 681ms
- /dashboard: 628ms
- /u/domz_test: 0ms

## Notes

- Flag anything above roughly 4000-5000ms locally as a should-fix.
- /matches should stay paginated at 250 logs.
- /settings/profile should remain light even after the richer preview builder.

## Console errors

- public: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=Oe6DfmU8yfiFxH6J75nH5' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=Oe6DfmU8yfiFxH6J75nH5' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=wuUs-X3hGwukfI8IsGeZu' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=wuUs-X3hGwukfI8IsGeZu' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=KkkolEGu2hq8nUBhidyv6' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=wuUs-X3hGwukfI8IsGeZu' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=FvUNKvk6cdL_AqqSgXV28' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=wuUs-X3hGwukfI8IsGeZu' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=DUd0wfaX3n2H6Pmt6Mce0' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=wuUs-X3hGwukfI8IsGeZu' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=DUd0wfaX3n2H6Pmt6Mce0' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=wuUs-X3hGwukfI8IsGeZu' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=0vFtBbS64GsNRhy-DddR2' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=0vFtBbS64GsNRhy-DddR2' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=0vFtBbS64GsNRhy-DddR2' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=kIbRB9aCn1Bk_Rwcvmx-h' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=kIbRB9aCn1Bk_Rwcvmx-h' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=wuUs-X3hGwukfI8IsGeZu' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=kIbRB9aCn1Bk_Rwcvmx-h' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=FhAHu-Sz5ahnD7-9epNcN' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=FhAHu-Sz5ahnD7-9epNcN' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=FhAHu-Sz5ahnD7-9epNcN' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=wuUs-X3hGwukfI8IsGeZu' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=4RGQEwQUTK2sh4NaSIqmf' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=wuUs-X3hGwukfI8IsGeZu' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=o7_Sx2aoMQGVgWNYVYQk5' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=wuUs-X3hGwukfI8IsGeZu' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=KjbzqCmcBTBkMp3ZP8Fke' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=Z70u1gM2-y0Ho-CE1ll7H' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=wuUs-X3hGwukfI8IsGeZu' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=ERsbbIk6MzOt7a0o8W-uO' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=eemGdujMkwwfv5A45AIwo' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=3Ad7aVaCeUFA9AbNzp9OK' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=eemGdujMkwwfv5A45AIwo' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=eemGdujMkwwfv5A45AIwo' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=vcHhs5JMLCTN_knlVSv1g' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=r12WqEn72PpEcBu7XOSm_' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=pFECetRYjtNc7AWsizmn7' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=FjR8aFOMIURVH6oyrgCie' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=13ACECNPrGZ_Of6KqdcPB' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=YOW_T2W7wysFmrxmS7Na0' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=dQaF8DvDDcfVE2I0IVeFI' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=pfK_iC6_BjEGpbL-fEYXN' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=xM7-s2RUGwyfpRQJckgN4' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=VhOuEOwscsxbT607uKOkg' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=DULYDbuD-9cnDzfN5f1cF' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=iLZXVg29nIxCtiMVYgFNW' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=iLZXVg29nIxCtiMVYgFNW' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=nGbh_2Yu-Qo_XD_1ezu0r' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=nGbh_2Yu-Qo_XD_1ezu0r' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=nGbh_2Yu-Qo_XD_1ezu0r' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=pfK_iC6_BjEGpbL-fEYXN' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=4ZTjzs5amqTBWCkEHv-He' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=VhOuEOwscsxbT607uKOkg' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=4ZTjzs5amqTBWCkEHv-He' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=tlB093SwY5KhkqwxPBGfw' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=tlB093SwY5KhkqwxPBGfw' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=C9ESk1Xe5EIBE1iQikEU8' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=VhOuEOwscsxbT607uKOkg' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=pfK_iC6_BjEGpbL-fEYXN' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=VhOuEOwscsxbT607uKOkg' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=pfK_iC6_BjEGpbL-fEYXN' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=oPlsI_sefYV7swCblLojo' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=Y7CbTkQGkWo7-xAO0wlRr' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=nYCicAEmWnzWSie4Fj2UY' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=_4JKn1oo7ym3ariiyFlI_' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=nYCicAEmWnzWSie4Fj2UY' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=qOxzhjKnsmLZkw1XqzKux' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=M4ygnHXquO9a9DFwkau7W' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3100/_next/webpack-hmr?id=pfK_iC6_BjEGpbL-fEYXN' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
