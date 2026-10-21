# Third-party notices

AI Robot Workshop is licensed under the MIT License. That license applies to the
original project material covered by the repository's `LICENSE`; it does not
replace or override third-party terms.

## Direct JavaScript dependencies

The following inventory was read from the installed direct packages' `package.json`
metadata on October 21, 2026. Versions are the exact versions declared and installed
for this repository.

### Runtime dependencies

| Package | Version | Declared license |
| --- | --- | --- |
| `@agentclientprotocol/codex-acp` | 2.2.2 | Apache-2.0 |
| `@agentclientprotocol/sdk` | 1.9.0 | Apache-2.0 |
| `@supabase/ssr` | 0.12.7 | MIT |
| `@supabase/supabase-js` | 2.118.0 | MIT |
| `lucide-react` | 1.59.0 | ISC |
| `next` | 16.4.2 | MIT |
| `react` | 19.3.1 | MIT |
| `react-dom` | 19.3.1 | MIT |
| `react-markdown` | 10.1.0 | MIT |
| `remark-gfm` | 4.0.1 | MIT |
| `three` | 0.186.1 | MIT |
| `unpdf` | 1.9.0 | MIT |
| `zod` | 4.6.7 | MIT |

### Development dependencies

| Package | Version | Declared license |
| --- | --- | --- |
| `@playwright/test` | 1.64.1 | Apache-2.0 |
| `@types/node` | 22.20.5 | MIT |
| `@types/react` | 19.3.0 | MIT |
| `@types/react-dom` | 19.3.0 | MIT |
| `@types/three` | 0.186.0 | MIT |
| `tsx` | 4.23.15 | MIT |
| `typescript` | 5.9.3 | Apache-2.0 |
| `vitest` | 5.0.5 | MIT |

Each dependency remains subject to its own license, copyright statements, and
notices. License files are distributed with the installed packages. This direct
dependency list is not a substitute for reviewing the complete installed dependency
tree when redistributing a bundled build.

The installed Playwright package includes this notice:

> Playwright
>
> Copyright (c) Microsoft Corporation
>
> This software contains code derived from the Puppeteer project
> (https://github.com/puppeteer/puppeteer), available under the Apache 2.0
> license (https://github.com/puppeteer/puppeteer/blob/master/LICENSE).

## Referenced hardware and documentation

Manufacturer and supplier pages, datasheets, pinouts, product names, and trademarks
linked from this project are external references. They are not endorsements, are not
covered by the project's MIT License, and remain subject to their owners' terms. A
link or citation does not grant permission to redistribute the referenced material.

The generated CircuitPython examples require users to install CircuitPython and, for
the sensor routes, external drivers such as `adafruit_bme280`,
`adafruit_bus_device`, and `adafruit_register` separately. Those runtimes and drivers
are not relicensed by this project; consult the versions you install for their
licenses and notices.

Files and data imported by users remain subject to their owners' rights and chosen
licenses. Importing, previewing, transforming, or exporting them through AI Robot
Workshop does not transfer ownership or place them under the project's MIT License.
