# Playtest 250 Performance Audit

Date: 2026-06-24

## Route timings

- /decks/fdf38baf-d650-4365-9632-79fb250b85e7: 4892ms
- /matchups: 2235ms
- /matchups: 2148ms
- /matches?page=2: 1580ms
- /matches: 1232ms
- /matches: 1163ms
- /review: 1092ms
- /decks/fdf38baf-d650-4365-9632-79fb250b85e7: 1016ms
- /dashboard: 983ms
- /matches/new: 969ms
- /review: 964ms
- /: 899ms
- /dashboard: 881ms
- /review: 848ms
- /matches/new: 819ms
- /decks: 808ms
- /matches/new: 783ms
- /decks: 772ms
- /profile: 713ms
- /dashboard: 662ms
- /profile: 659ms
- /demo: 578ms
- /u/domz_test: 0ms

## Notes

- Flag anything above roughly 4000-5000ms locally as a should-fix.
- /matches should stay paginated at 250 logs.
- /settings/profile should remain light even after the richer preview builder.

## Console errors

- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=qe9v0nXjVAZ_H9qg_xBKg' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=qe9v0nXjVAZ_H9qg_xBKg' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6XHDAN5GKByIUyirCfQN_' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6XHDAN5GKByIUyirCfQN_' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=AAOzjAl2tC0MBT5yAo7_O' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6XHDAN5GKByIUyirCfQN_' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=Obwe7xFTGIbrcceTQg0Jz' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=VjqCoxSHTA_XPDL-kefZv' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6XHDAN5GKByIUyirCfQN_' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=VjqCoxSHTA_XPDL-kefZv' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6XHDAN5GKByIUyirCfQN_' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=pwJ-SsI3WoSPVnvdsJWVP' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6XHDAN5GKByIUyirCfQN_' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=pwJ-SsI3WoSPVnvdsJWVP' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=pwJ-SsI3WoSPVnvdsJWVP' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=ls1RNaG5Gcx4Gh1RYgPll' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=ls1RNaG5Gcx4Gh1RYgPll' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=ls1RNaG5Gcx4Gh1RYgPll' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6XHDAN5GKByIUyirCfQN_' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=77cLvYDDnS44DRE6ZvZuc' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=77cLvYDDnS44DRE6ZvZuc' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=77cLvYDDnS44DRE6ZvZuc' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=eF0ikRORIqIBtOcSZ3VZJ' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6XHDAN5GKByIUyirCfQN_' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=eF0ikRORIqIBtOcSZ3VZJ' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6XHDAN5GKByIUyirCfQN_' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=H0B0BqXci_oxzccstLxdF' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6XHDAN5GKByIUyirCfQN_' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6XHDAN5GKByIUyirCfQN_' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=Jh89yYv33NJrIMLMVwuyj' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=Jh89yYv33NJrIMLMVwuyj' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=mPUCEKQtJ4oHQtWkaAaFk' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=Xp6YZbw25K3VSeKu8Ei1V' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6n8ip3G6lc8h4gBEm1PJb' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=U8l8C2mzNZ-J6jteQ0Iy_' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=bYsaC831fyIkSv1uCUUUd' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=cTaXd_aWgLgT5MQJDfnrb' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=gos1gF8dGyQp1pfqUXTRV' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=nT5hDeTkgOR82o8UP6D8J' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=R5h5jEA4HKjvtC-8nsFlS' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=l4_6dh1l8o_pydOcT04YW' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=EhpKPKitgqVMd6J9Q0jo6' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=9R4Tc4VmqjJvS0P0QFAIM' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=1t2DUP9qGRji5lM-ll4uC' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=1t2DUP9qGRji5lM-ll4uC' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=DT0onSNHVHKdrmZUio0Gv' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=R5h5jEA4HKjvtC-8nsFlS' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=DT0onSNHVHKdrmZUio0Gv' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=nT5hDeTkgOR82o8UP6D8J' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=DT0onSNHVHKdrmZUio0Gv' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=wbgDmiLsXwEIT--weqA-A' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=wbgDmiLsXwEIT--weqA-A' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=jRr4Mb5xcqE6mtmTrkx8r' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=jRr4Mb5xcqE6mtmTrkx8r' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=nT5hDeTkgOR82o8UP6D8J' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=cGTAE4GKMtbsPFzto285F' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=R5h5jEA4HKjvtC-8nsFlS' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=nT5hDeTkgOR82o8UP6D8J' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=cGTAE4GKMtbsPFzto285F' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=MhRyLc6ZxeCJirewFZl7Y' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=R5h5jEA4HKjvtC-8nsFlS' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=nT5hDeTkgOR82o8UP6D8J' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=JoigtMULais2qHlXzDhNT' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=R5h5jEA4HKjvtC-8nsFlS' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=nT5hDeTkgOR82o8UP6D8J' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=9B7jswLgEZUAznI76MTSm' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=doEZLaQQGTkYHi6oLKV3Z' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=xcnmzjeT5mNnH003U4dVh' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=xcnmzjeT5mNnH003U4dVh' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=WsAZd3B4V1a3f93r4RU9n' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=lBancyrPKqmXLh_jVHw4r' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=R5h5jEA4HKjvtC-8nsFlS' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
