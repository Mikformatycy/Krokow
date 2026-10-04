# Dependencies and licences

Inventory: 2026-10-04. Versions and licence identifiers below were read from installed package.json files for every direct external dependency in workspace manifests (including development tools). This is not a complete audit of transitive dependencies, notices or distribution obligations. pnpm-lock.yaml is the version source; preserve upstream licence files when packaging.

| Package | Installed version | Licence identifier | Local metadata |
| --- | --- | --- | --- |
| @eslint/js | 10.0.1 | MIT | `node_modules/@eslint/js/package.json` |
| @fastify/cors | 11.3.0 | MIT | `apps/api/node_modules/@fastify/cors/package.json` |
| @playwright/test | 1.63.0 | Apache-2.0 | `apps/mobile/node_modules/@playwright/test/package.json` |
| @react-native/metro-config | 0.86.3 | MIT | `apps/mobile/node_modules/@react-native/metro-config/package.json` |
| @types/node | 24.19.1 | MIT | `node_modules/@types/node/package.json` |
| @types/pg | 8.23.1 | MIT | `infra/node_modules/@types/pg/package.json` |
| @types/react | 19.2.18 | MIT | `apps/mobile/node_modules/@types/react/package.json` |
| eslint | 10.12.0 | MIT | `node_modules/eslint/package.json` |
| expo | 57.0.26 | MIT | `apps/mobile/node_modules/expo/package.json` |
| expo-constants | 57.0.20 | MIT | `apps/mobile/node_modules/expo-constants/package.json` |
| expo-linking | 57.0.11 | MIT | `apps/mobile/node_modules/expo-linking/package.json` |
| expo-router | 57.0.24 | MIT | `apps/mobile/node_modules/expo-router/package.json` |
| expo-speech | 57.0.3 | MIT | `apps/mobile/node_modules/expo-speech/package.json` |
| expo-status-bar | 57.0.1 | MIT | `apps/mobile/node_modules/expo-status-bar/package.json` |
| fastify | 5.12.5 | MIT | `apps/api/node_modules/fastify/package.json` |
| globals | 17.13.0 | MIT | `node_modules/globals/package.json` |
| pg | 8.23.1 | MIT | `infra/node_modules/pg/package.json` |
| react | 19.2.3 | MIT | `apps/mobile/node_modules/react/package.json` |
| react-dom | 19.2.3 | MIT | `apps/mobile/node_modules/react-dom/package.json` |
| react-native | 0.86.3 | MIT | `apps/mobile/node_modules/react-native/package.json` |
| react-native-gesture-handler | 2.32.0 | MIT | `apps/mobile/node_modules/react-native-gesture-handler/package.json` |
| react-native-reanimated | 4.5.1 | MIT | `apps/mobile/node_modules/react-native-reanimated/package.json` |
| react-native-safe-area-context | 5.7.0 | MIT | `apps/mobile/node_modules/react-native-safe-area-context/package.json` |
| react-native-screens | 4.26.2 | MIT | `apps/mobile/node_modules/react-native-screens/package.json` |
| react-native-web | 0.21.3 | MIT | `apps/mobile/node_modules/react-native-web/package.json` |
| react-native-worklets | 0.10.1 | MIT | `apps/mobile/node_modules/react-native-worklets/package.json` |
| tsx | 4.23.15 | MIT | `infra/node_modules/tsx/package.json` |
| typescript | 5.9.3 | Apache-2.0 | `node_modules/typescript/package.json` |
| typescript-eslint | 8.71.0 | MIT | `node_modules/typescript-eslint/package.json` |
| vitest | 4.1.11 | MIT | `infra/node_modules/vitest/package.json` |
| zod | 4.6.5 | MIT | `packages/contracts/node_modules/zod/package.json` |

## Other dependencies and unresolved decisions

- OpenStreetMap data: ODbL 1.0 and attribution recorded in archive metadata; BBBike and Overpass distribute the inputs. See [data sources](data-sources.md). Public download access is separate from permission to redistribute derived data.
- Expo Go and ngrok are optional development services for phone preview; the local web scenario requires neither account. Their service terms are separate from npm package licences.
- Node and pnpm are pinned in the root manifest/.node-version. PostgreSQL/PostGIS/Docker are optional infrastructure components; no full licence inventory of the database image or system packages was performed here. Before distributing an image, record its component licences and notices.
- No explicit licence for the project's own code has been selected in the repository. The owner must choose distribution terms before handing it to another organisation; this document does not grant a new licence.
- No Google Maps, ORS or paid map API is integrated. No LLM is used in route calculation or generation of infrastructure facts.
- Before public/commercial distribution, extend the inventory to transitive/runtime dependencies, assets, container contents and any third-party speech services. No new licence has been assigned by this documentation update.
