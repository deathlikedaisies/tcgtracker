# Playtest 250 Performance Audit

Date: 2026-06-24

## Route timings

- /decks/a33ee642-08e9-4f86-821a-e000d3fdd78c: 5679ms
- /matchups: 2153ms
- /matchups: 1934ms
- /matches?page=2: 1179ms
- /matches: 1171ms
- /matches: 1150ms
- /review: 1073ms
- /decks/a33ee642-08e9-4f86-821a-e000d3fdd78c: 1035ms
- /profile: 980ms
- /review: 910ms
- /matches/new: 891ms
- /review: 884ms
- /decks: 867ms
- /: 848ms
- /decks: 797ms
- /dashboard: 770ms
- /dashboard: 767ms
- /matches/new: 712ms
- /matches/new: 706ms
- /dashboard: 664ms
- /profile: 618ms
- /demo: 605ms
- /u/domz_test: 0ms

## Notes

- Flag anything above roughly 4000-5000ms locally as a should-fix.
- /matches should stay paginated at 250 logs.
- /settings/profile should remain light even after the richer preview builder.

## Console errors

- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=xfdyPhWCYM_0OeLGHiM7z' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=xfdyPhWCYM_0OeLGHiM7z' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=GDhzxUrvph58RbkLG1mzs' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=GDhzxUrvph58RbkLG1mzs' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=vHGxtiFz_7jswfghntw_5' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=-N1rBtx_lTHKM8pxghiPO' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=GDhzxUrvph58RbkLG1mzs' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=pz1ZAWGlb8eDAI52mZ7Ca' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=GDhzxUrvph58RbkLG1mzs' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=pz1ZAWGlb8eDAI52mZ7Ca' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=GDhzxUrvph58RbkLG1mzs' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=MWBu8mXKDNhfsxbRGezc9' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=GDhzxUrvph58RbkLG1mzs' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=MWBu8mXKDNhfsxbRGezc9' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=tzuRj-RCIja1JWtXzUkS8' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=tzuRj-RCIja1JWtXzUkS8' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=tzuRj-RCIja1JWtXzUkS8' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=jCWPa-loOof-eh4GeHURK' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=GDhzxUrvph58RbkLG1mzs' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=jCWPa-loOof-eh4GeHURK' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=jCWPa-loOof-eh4GeHURK' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=5oQ4xshB6Lb9p64sAVgnh' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=5oQ4xshB6Lb9p64sAVgnh' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=GDhzxUrvph58RbkLG1mzs' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=rgWxgnfCb_qlVodE4wZsu' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=GDhzxUrvph58RbkLG1mzs' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=JckjVHiiWZ9oxMZ0jGxI1' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=GDhzxUrvph58RbkLG1mzs' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=SbuScUr6pvIb_wvZ-AEdj' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=GDhzxUrvph58RbkLG1mzs' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=NoqsjpJCaX06b8A8GJQdJ' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=DGuDVf4DmYDo6jJYC0oAp' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=NoqsjpJCaX06b8A8GJQdJ' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=8-vQ8c-Cg1dYRC1USaIDH' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=ge0QQQ0OyFi_mNJOsYXSA' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=go5oPlf45dNTHRrRs-ox4' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=3O6ZWnSUkqHnPYDhMngUN' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=b5OGTR8kTcMy6ruY8D8p7' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=YTvP2Whv5fR16P2XRYE_t' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=W5J270Qc0LQ4ZUb1Jfmok' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=UOcjfWOOQ9g7Vs-a9ab_z' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=IEu0MRiIsVriLp5ikfpXN' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=RbZXziQ2b5N1ApfygHOL5' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=Lkp_QWyqphkiQJcrExA6Z' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=2bSYvZ4OmELS-nP4Yat_x' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=UOcjfWOOQ9g7Vs-a9ab_z' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=2bSYvZ4OmELS-nP4Yat_x' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=--1v-q1fiJFDW9OBPktou' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=--1v-q1fiJFDW9OBPktou' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=IEu0MRiIsVriLp5ikfpXN' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=--1v-q1fiJFDW9OBPktou' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=UOcjfWOOQ9g7Vs-a9ab_z' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=pHI3rKZg4ZdekQveHiQ6J' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=pHI3rKZg4ZdekQveHiQ6J' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=dmDHGW57D9i8bk76GKFZz' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=dmDHGW57D9i8bk76GKFZz' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=jxwIDqSUI9GBrO8HbDWDd' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=UOcjfWOOQ9g7Vs-a9ab_z' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=IEu0MRiIsVriLp5ikfpXN' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=jxwIDqSUI9GBrO8HbDWDd' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=IEu0MRiIsVriLp5ikfpXN' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=J9MQa2aZTuGyBJPAGk-U6' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=t78ZYC5IepCAgA6vdgIJp' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=UOcjfWOOQ9g7Vs-a9ab_z' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=IEu0MRiIsVriLp5ikfpXN' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=YJJVC-wd53fkjeJpo6Hfc' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=R1_7hLKUZxLic-dlmzWGp' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=8IVzSLjgHPu1HGq9yLnqm' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=-nrqp2ZLo4wgNkC7gIEhJ' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=-nrqp2ZLo4wgNkC7gIEhJ' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
