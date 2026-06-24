# Playtest 250 Performance Audit

Date: 2026-06-24

## Route timings

- /matches: 7781ms
- /matches?page=2: 2588ms
- /matchups: 2231ms
- /matchups: 1853ms
- /decks: 1614ms
- /decks/e5cd6abb-cd96-4605-b569-f8b91eba50dc: 1592ms
- /matches: 1458ms
- /decks/e5cd6abb-cd96-4605-b569-f8b91eba50dc: 1394ms
- /review: 1360ms
- /: 1326ms
- /matches/new: 1316ms
- /review: 1073ms
- /review: 1000ms
- /decks: 975ms
- /dashboard: 896ms
- /matches/new: 893ms
- /dashboard: 816ms
- /matches/new: 795ms
- /profile: 770ms
- /dashboard: 740ms
- /demo: 705ms
- /profile: 685ms
- /u/domz_test: 0ms

## Notes

- Flag anything above roughly 4000-5000ms locally as a should-fix.
- /matches should stay paginated at 250 logs.
- /settings/profile should remain light even after the richer preview builder.

## Console errors

- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=FLLDMLmNmi9ISgIyTt_7B' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=FLLDMLmNmi9ISgIyTt_7B' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6A7S0iLASvbCseyOq8jhR' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6A7S0iLASvbCseyOq8jhR' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=TswTcV9sZgRCcDvQLXrzs' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6A7S0iLASvbCseyOq8jhR' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=SM2QeP2m35aNn1aFlX5Ha' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6A7S0iLASvbCseyOq8jhR' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=N6YkRDjysf-Xp2NsVgcND' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6A7S0iLASvbCseyOq8jhR' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=N6YkRDjysf-Xp2NsVgcND' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6A7S0iLASvbCseyOq8jhR' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=k9cHirLND5A1mevV1kkMS' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=k9cHirLND5A1mevV1kkMS' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=k9cHirLND5A1mevV1kkMS' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=0E-5zxlou6uHLQ4kmmlgC' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=0E-5zxlou6uHLQ4kmmlgC' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6A7S0iLASvbCseyOq8jhR' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=0E-5zxlou6uHLQ4kmmlgC' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=jnp1SyqAiDl8Ncb9zvFoK' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=jnp1SyqAiDl8Ncb9zvFoK' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=jnp1SyqAiDl8Ncb9zvFoK' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6A7S0iLASvbCseyOq8jhR' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=1EzCMQaFNghSRJZ0oqVjH' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=1EzCMQaFNghSRJZ0oqVjH' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6A7S0iLASvbCseyOq8jhR' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6A7S0iLASvbCseyOq8jhR' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=6A7S0iLASvbCseyOq8jhR' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=U-To6fo946nYu0GoMwNCV' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=mFz2nmiVdTInE-7BQSFrM' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=uFkA-ZUCrYyIPLjQV-tG4' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=mFz2nmiVdTInE-7BQSFrM' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=mFz2nmiVdTInE-7BQSFrM' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=WLhCFX3KQZ3GpcdlVjPmS' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=HYRgf4zq3dUJ59tb2ZlkD' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=RnGwID6BRjxi0IqZeAxlg' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=ZUNpC9QHidYV5IQJff12I' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=lUwPtMHN59a6SiXyOPicD' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=binOVKXVk_3WGK26178I7' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=uGPczPBWD4hDrVuaTndb_' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=7XgIVMLORDOCe4eWHVw33' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=GwrzJ-_qoKCNiz-zdPBba' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=eb9mUf_M5vewFJ3EgX2TR' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=d9LcQPAbuv7VSJiJEqAP6' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=eb9mUf_M5vewFJ3EgX2TR' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=If5GKiVTfxcv4xgv2mzyE' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=If5GKiVTfxcv4xgv2mzyE' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=uGPczPBWD4hDrVuaTndb_' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=If5GKiVTfxcv4xgv2mzyE' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=FMCcQckLmPkBmdZeOjpZn' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=FMCcQckLmPkBmdZeOjpZn' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=d9LcQPAbuv7VSJiJEqAP6' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=FMCcQckLmPkBmdZeOjpZn' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=VgIiMWLAYPAawFDSERhNK' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=VgIiMWLAYPAawFDSERhNK' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=1PDsB0RkpuUpL8c8BKgvQ' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=uGPczPBWD4hDrVuaTndb_' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=d9LcQPAbuv7VSJiJEqAP6' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=1PDsB0RkpuUpL8c8BKgvQ' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=1PDsB0RkpuUpL8c8BKgvQ' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=d9LcQPAbuv7VSJiJEqAP6' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=uGPczPBWD4hDrVuaTndb_' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=d9LcQPAbuv7VSJiJEqAP6' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=uGPczPBWD4hDrVuaTndb_' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=d9LcQPAbuv7VSJiJEqAP6' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=uGPczPBWD4hDrVuaTndb_' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=YPaPXMFcwovhSMXiYHOTN' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=jisFFqnyIWlga9lGUzZ_k' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=NNRKDQWUnH46BpEGFXphI' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=S_zD4MQq1m98EebromO-J' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- public: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=uGPczPBWD4hDrVuaTndb_' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=S_zD4MQq1m98EebromO-J' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=UFNR5n9yopjmXdH4euNoW' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=YPaPXMFcwovhSMXiYHOTN' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- mobile-430: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=7ZhnNhoK9anS3bdRZpLIs' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
- desktop: WebSocket connection to 'ws://127.0.0.1:3000/_next/webpack-hmr?id=d9LcQPAbuv7VSJiJEqAP6' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
