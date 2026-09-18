# Third-Party Notices

Blackwing bundles or builds upon the following open-source components. Their
licenses are reproduced/linked below and continue to apply to those components.

| Component | Purpose | License |
|---|---|---|
| Autonomous red-teaming engine (`vxcontrol/pentagi`) | The assessment engine container image driven by Blackwing | MIT — https://github.com/vxcontrol/pentagi/blob/master/LICENSE |
| Paged.js | CSS Paged Media renderer used to lay out the PDF report | MIT — https://gitlab.coko.foundation/pagedjs/pagedjs |
| Puppeteer | Headless Chromium automation for PDF rendering | Apache-2.0 |
| Carlito font | Report body typeface | SIL Open Font License 1.1 |
| Poppins font | Report display typeface | SIL Open Font License 1.1 |
| Express, React, Vite, and other npm dependencies | Application framework | See each package's license (MIT unless noted) |

The bundled fonts under `gui/server/services/report/assets/fonts/` are licensed
under the SIL Open Font License 1.1 (https://openfontlicense.org). The Paged.js
bundle under `gui/server/services/report/assets/` is licensed under MIT.

The engine container image is pulled at runtime and is not redistributed as part
of this repository.
