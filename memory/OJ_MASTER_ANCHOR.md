# OJ MASTER ANCHOR — AISPORE (GitHub SSOT)

Last updated: 2026-02-10
Owner: Marko
Orchestrator: OJ

## Mikä tämä on
Tämä tiedosto varmistaa, että OJ (ja muut agentit) löytävät aina **GitHubista** AISPORE:n nykytilan ja SSOT-muistit ilman selaimen “katoamista”.

## Mistä löydän tämän GitHubissa
GitHub repo: markovalitalo6-code / AISPORE

Polku repossa:
- `memory/`  ← kaikki SSOT-muistit täällä

Avaa GitHubissa repo → selaa kansioon:
- `memory/OJ_MASTER_ANCHOR.md` (tämä tiedosto)
- `memory/OJ_START_HERE.md`
- `memory/state.md`
- `memory/project.md`
- `memory/decisions.md`

Jos joku väittää “en pääse lukemaan GitHubista”:
- SSOT on **repo-tiedostoina** polussa `memory/` (ei Actions, ei Issues, ei PR-kommentit).
- Avaa GitHub → Code → memory → tiedostot yllä.

## SSOT-lukemisjärjestys (älä improvisoi)
1) `memory/OJ_START_HERE.md`  (nopein orientaatio)
2) `memory/state.md`          (mikä toimii nyt, miten ajetaan)
3) `memory/decisions.md`      (lukitut päätökset, “ei enää säätöä”)
4) `memory/project.md`        (konteksti + rajat + next steps)
(Kaikki muut tiedostot ovat toissijaisia verrattuna näihin.)

## “Mikä on nyt valmista”
- Weekly lock idempotency: VERIFIED (W09 + seed immutability)
- Admin gating + public readback: VERIFIED (curl todistus kirjattu state.md)
- Hardening A (rate limit): MERGED masteriin ja VERIFIED
- Gemini PR review CI: toimii (mutta EI ole core-työ)

## Miten käynnistän lokaalisti (2 terminaalia)
Terminal A — API:
- `cd "$HOME/hub/AI-WorkSpace/01_projects/ai-spore/src/api"`
- `ADMIN_KEY=dev_admin PORT=3100 pnpm run dev`

Terminal B — WEB:
- `cd "$HOME/hub/AI-WorkSpace/01_projects/ai-spore/web/ai-spore-site"`
- `PORT=3000 npm run dev`
Huom: jos saat EADDRINUSE 3000 → joku on jo ajossa (sulje vanha tai vaihda portti).

## Mitä EI tehdä
- Ei uusia järjestelmiä / uusia ideoita kesken hardeningin.
- Ei “säädetä” takaisin ja eteenpäin ilman että päätös kirjataan `memory/decisions.md`.
- TG/badges/snake ei laajenneta nyt (pysytään core-loopissa).

## Next steps (yksi kerrallaan)
1) Varmista master toimii lokaalisti (API:3100, WEB:3000)
2) Varmista rate limit: burst → 429, normaali looppi → 200
3) Hardening B/C vain jos löytyy oikea riski (muuten LOCK)
