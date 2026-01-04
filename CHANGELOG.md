# Changelog

## [1.3.0](https://github.com/flowcore-io/calendrun-backend/compare/v1.2.2...v1.3.0) (2026-01-04)


### Features

* add endpoint to fetch recent run recordings for club members with optional status filter ([3074731](https://github.com/flowcore-io/calendrun-backend/commit/307473187ea988b5bb6ac7035d078024a6bc7568))

## [1.2.2](https://github.com/flowcore-io/calendrun-backend/compare/v1.2.1...v1.2.2) (2026-01-04)


### Bug Fixes

* update performance_log table schema and add conflict handling in run handlers ([4b13de1](https://github.com/flowcore-io/calendrun-backend/commit/4b13de1ac78318462b1a416abeccc83b52c882fd))

## [1.2.1](https://github.com/flowcore-io/calendrun-backend/compare/v1.2.0...v1.2.1) (2026-01-04)


### Bug Fixes

* update health route to use dynamic version from package.json ([a8fa4a2](https://github.com/flowcore-io/calendrun-backend/commit/a8fa4a2d44d9811ad9810580434bc5f194d05f88))

## [1.1.1](https://github.com/flowcore-io/calendrun/compare/v1.1.0...v1.1.1) (2026-01-04)


### Bug Fixes

* enhance performance logging for deletion events ([5b174f6](https://github.com/flowcore-io/calendrun/commit/5b174f6fd7bb398a925e2a4d8b2df3e57ed38a7e))

## [1.1.0](https://github.com/flowcore-io/calendrun/compare/v1.0.5...v1.1.0) (2026-01-04)


### Features

* add performance logging functionality ([580ee4f](https://github.com/flowcore-io/calendrun/commit/580ee4f0bdf8f776c24bfc7adfae9ce579eeaed8))

## [1.0.5](https://github.com/flowcore-io/calendrun/compare/v1.0.4...v1.0.5) (2026-01-04)


### Bug Fixes

* add ignoreCommand to vercel.json for frontend deployment ([a0e1fe0](https://github.com/flowcore-io/calendrun/commit/a0e1fe06078948a369c82ce6d56fdb08113a087f))
* add ingest-specific-fragments script and streamline package.json workspaces ([6a620a8](https://github.com/flowcore-io/calendrun/commit/6a620a8bab4e2f9421b5fbc789c4e012c92b4304))
* enhance ignoreCommand in vercel.json for better deployment handling ([43e2ff1](https://github.com/flowcore-io/calendrun/commit/43e2ff15f1329b438ab9d49ad3befa09eebe1c7d))
* simplify ignoreCommand in vercel.json for streamlined deployment checks ([e237da4](https://github.com/flowcore-io/calendrun/commit/e237da4d4a1dbec11bc1b8195fd9a129eea989f5))
* update README.md with detailed Vercel deployment configuration ([22d10c5](https://github.com/flowcore-io/calendrun/commit/22d10c53fa07571db9991c35f0fa057b54d0c3f5))
* update run.deleted event handling to perform hard delete ([9e56430](https://github.com/flowcore-io/calendrun/commit/9e56430febbab761b4a8c0164fd6bfcd74254ea3))

## [1.0.4](https://github.com/flowcore-io/calendrun/compare/v1.0.3...v1.0.4) (2026-01-03)


### Bug Fixes

* improve run handling and validation ([a89545f](https://github.com/flowcore-io/calendrun/commit/a89545f99f6fffe828d471a43b7dfac81a82c03d))

## [1.0.3](https://github.com/flowcore-io/calendrun/compare/v1.0.2...v1.0.3) (2026-01-03)


### Bug Fixes

* update GitHub Actions workflow to extract version from release tag ([b7ba86b](https://github.com/flowcore-io/calendrun/commit/b7ba86b22b42fa4d5d9172a817b52826e6e80429))

## [1.0.2](https://github.com/flowcore-io/calendrun/compare/v1.0.1...v1.0.2) (2026-01-03)


### Bug Fixes

* update Kubernetes deployment documentation and scripts ([93b411c](https://github.com/flowcore-io/calendrun/commit/93b411c21438e405b5401229dc38188a98fdd981))

## [1.0.1](https://github.com/flowcore-io/calendrun/compare/v1.0.0...v1.0.1) (2026-01-03)


### Bug Fixes

* add NPM token support for private package access in Docker builds ([560f19f](https://github.com/flowcore-io/calendrun/commit/560f19f88b1d4bd6804e5bb0c2317e56551325b1))
* downgrade @flowcore/hono-api dependency to version 0.3.0 ([5516fcf](https://github.com/flowcore-io/calendrun/commit/5516fcf1d8166adc3265c7a85e11fb68beafe71e))

## 1.0.0 (2026-01-03)


### Features

* add confetti celebration for opening all doors in challenge calendar ([55b58c2](https://github.com/flowcore-io/calendrun/commit/55b58c26c864d21079cef1d9d2775477a3930935))
* add December 2025 background images and update theme configuration for faster loads ([0a0d9ce](https://github.com/flowcore-io/calendrun/commit/0a0d9ce6b9a1b7183cb99c8f4929db5b5649f3ca))
* Add distance planning and remaining distance calculation for challenge instances ([c3a0b02](https://github.com/flowcore-io/calendrun/commit/c3a0b02f64d6abd4c6564737a61f477d75cd516d))
* Add Docker support with multi-stage builds, environment configuration, and Playwright for E2E testing ([33caa0a](https://github.com/flowcore-io/calendrun/commit/33caa0a2c417b8f177102b18fbde033b770bd832))
* add Everybody page with leaderboard and localization support ([097d2bf](https://github.com/flowcore-io/calendrun/commit/097d2bfd3e488e0eef668ba7a1c034a93cc09a22))
* Add initial project structure with environment configuration, authentication setup, and database health check ([23eabd5](https://github.com/flowcore-io/calendrun/commit/23eabd5ddc4fc8a29e649c71dd5340309d926d22))
* Add new pages for Home, Club, Profile, and Challenge Calendar ([a768707](https://github.com/flowcore-io/calendrun/commit/a768707ae6784d8bfa2158b7f798cccff835fb0b))
* add PWA support and enhance localization ([a2b0f2c](https://github.com/flowcore-io/calendrun/commit/a2b0f2c00eb866a92c4521242bb1d06724312022))
* Add user profile management with database schema, event handling, and API endpoints for user initialization ([8a37bc7](https://github.com/flowcore-io/calendrun/commit/8a37bc719724b6c5e363300659655724fd870e06))
* add visual debug indicators for PWA redirect logic ([e935e3c](https://github.com/flowcore-io/calendrun/commit/e935e3c7332de7ea537dc058c44af2c31f543379))
* backend ([86b010f](https://github.com/flowcore-io/calendrun/commit/86b010fc0218551ebf19f84d4aa52914106a0599))
* Enhance authentication and admin features with Keycloak integration, sign-out handling, and challenge template management ([cc7af48](https://github.com/flowcore-io/calendrun/commit/cc7af4855de4c50624979f80b052563b156fcfa5))
* enhance challenge calendar and invite token handling ([9ca212d](https://github.com/flowcore-io/calendrun/commit/9ca212dc87961422b8cec2b4f50421279f9fa1f2))
* enhance challenge name resolution and validation for run distances ([43986c7](https://github.com/flowcore-io/calendrun/commit/43986c77d1cd5b855e1a7f7619778bede12ba455))
* enhance challenge variant handling and UI components ([2d3c6b5](https://github.com/flowcore-io/calendrun/commit/2d3c6b52ca4e7d10b657039925e21454929b5387))
* enhance club and challenge functionalities with welcome text and invite token management ([a6c9a10](https://github.com/flowcore-io/calendrun/commit/a6c9a10f2d40d691e7ca747d9b82ec0a956c2bf5))
* enhance club functionalities with invite management and user interactions ([686f4d8](https://github.com/flowcore-io/calendrun/commit/686f4d853bc3790c484dc9c50988065bb90d46a7))
* enhance club loading experience with skeleton screens ([e84d069](https://github.com/flowcore-io/calendrun/commit/e84d0693b239fc663509a9109f0c44161108f32e))
* enhance club retrieval by invite token with case-insensitive support ([d7c0370](https://github.com/flowcore-io/calendrun/commit/d7c0370ec4d750812d237cf4b584646af44ed92a))
* enhance layout and footer integration across components ([0e9a332](https://github.com/flowcore-io/calendrun/commit/0e9a33256c76e60d1dfc50ba048db6d08bacfe32))
* enhance metadata for CalendRun with Open Graph and Twitter integration ([8ac7f6e](https://github.com/flowcore-io/calendrun/commit/8ac7f6ef4e8887fc243ce022ad222732d34f1f8e))
* enhance middleware for locale detection and update Home page UI ([3448e28](https://github.com/flowcore-io/calendrun/commit/3448e28bebbeb0d7775da69d8990a8cad501b0be))
* enhance PWA cache management and introduce new admin tools ([f230ca6](https://github.com/flowcore-io/calendrun/commit/f230ca61a983c850983667881378a2bd3ecb9422))
* enhance PWA redirect logic for challenge pages after December 31st ([ebfc20f](https://github.com/flowcore-io/calendrun/commit/ebfc20f54a26547dd956328781e118e874cbb23e))
* enhance RunLog components with layout adjustments and new recordedAt feature ([2d15db5](https://github.com/flowcore-io/calendrun/commit/2d15db58b2afe351dabf2a6490db30f3139428ea))
* enhance session management and club actions with user details ([3be95b5](https://github.com/flowcore-io/calendrun/commit/3be95b577b56216dc421bfd1237153290c360279))
* enhance sign-out process with secure cookie management ([716aaf5](https://github.com/flowcore-io/calendrun/commit/716aaf5b547225554887527769702b489c420aab))
* Enhance user experience with new header and profile features ([055bb13](https://github.com/flowcore-io/calendrun/commit/055bb13412b25241625381b0356fd738453eedee))
* frontend ([2a1dbd0](https://github.com/flowcore-io/calendrun/commit/2a1dbd012976f0f42e8af3dcb3903473a3de0394))
* implement brutal PWA redirect logic for December challenges ([bacccb5](https://github.com/flowcore-io/calendrun/commit/bacccb5fb7e99b0d16674d04eaca95ff76642863))
* Implement challenge management features with database schema, event handling, and API endpoints for user interactions ([c5be8c1](https://github.com/flowcore-io/calendrun/commit/c5be8c16ea8937cff348f0a486dd6162411fec95))
* implement club features and enhance date formatting ([cdaa031](https://github.com/flowcore-io/calendrun/commit/cdaa0314070394d1fb5040ef124ffa38ea2387c9))
* implement current challenge status display and update theme for January ([3fb7c2e](https://github.com/flowcore-io/calendrun/commit/3fb7c2e5b737f1b9e79965051a1ad9edcfaa923d))
* implement January challenge promotion and update challenge logic ([2ce4cbe](https://github.com/flowcore-io/calendrun/commit/2ce4cbe776da222d9930ac9861b579ac175d4bc4))
* implement logic to filter out December challenges after December 31st ([f9f39c3](https://github.com/flowcore-io/calendrun/commit/f9f39c3eda14b2a8eabcd2a6d338ee00ba3d4467))
* implement PATCH endpoint for updating run performances ([27011d3](https://github.com/flowcore-io/calendrun/commit/27011d39dae31331189f576c71e2089256ab8130))
* implement PWA redirect logic and update localization keys ([40130cb](https://github.com/flowcore-io/calendrun/commit/40130cb0b772a466dfea5ab4fc857d8e526c0bd4))
* Implement run logging and management features for challenge instances ([6e9af7e](https://github.com/flowcore-io/calendrun/commit/6e9af7ea78852c33c15c6b8e725b21bdd76bae17))
* implement SignInButton component and update Home page UI ([3d461ff](https://github.com/flowcore-io/calendrun/commit/3d461ff2ef827aecf96ff3cc9e6cd9f5e9a83e9d))
* Implement user profile initialization and theme management with seasonal themes ([c09ebd7](https://github.com/flowcore-io/calendrun/commit/c09ebd7c445a24b0d0945aa9e15f1017fbc82913))
* improve layout and club leaderboard responsiveness ([c454cb4](https://github.com/flowcore-io/calendrun/commit/c454cb4a0a92b20a62ba474df9bb881cc82bcd8b))
* integrate Plausible analytics for improved tracking ([0bbf9aa](https://github.com/flowcore-io/calendrun/commit/0bbf9aab78bb3b8ca04d0c7f926438de3a2df886))
* integrate Stripe payment processing and subscription management ([2e6e2f5](https://github.com/flowcore-io/calendrun/commit/2e6e2f5d2bdbee9f58c0f76023c8bbfc5f93b14d))
* Internationalization support. App logo. Background image on landing page. ([3e905be](https://github.com/flowcore-io/calendrun/commit/3e905be911d53704fe4bfcb8b0337a0367ba5fb0))
* Introduce ChallengeBackground component for improved background image handling ([ee993e2](https://github.com/flowcore-io/calendrun/commit/ee993e20df421d4f5d4ed3672cc5ac28f74925b2))
* optimize club leaderboard fetching for improved performance ([6ec1e67](https://github.com/flowcore-io/calendrun/commit/6ec1e67603af1767445c77f80c8e349cc2afa474))
* refine December challenge redirection logic in layout and PWA handler ([2796017](https://github.com/flowcore-io/calendrun/commit/2796017f6021e882b6d0dd22569f271ab546b106))
* update .gitignore and optimize RunLogForm component ([6485bc3](https://github.com/flowcore-io/calendrun/commit/6485bc35d108dbd798436eb272e0d1be04e37b03))
* update application port and enhance localization support ([0ea7bfe](https://github.com/flowcore-io/calendrun/commit/0ea7bfe1b73cf111f9050bb66c370aa2ad7310e9))
* Update challenge instance and run management with Usable integration ([45cc226](https://github.com/flowcore-io/calendrun/commit/45cc226120dd898215a94f2e0235bea7409b8f22))
* update date logic for December challenges across components ([0281344](https://github.com/flowcore-io/calendrun/commit/0281344905edfceba61f63865a7228d65843c94a))
* update metadata generation with dynamic translations for improved localization ([71506e7](https://github.com/flowcore-io/calendrun/commit/71506e710b06f29b05ab0f6cbd1b72efec9049a2))


### Bug Fixes

* add new localization strings for club management ([3b5d1d3](https://github.com/flowcore-io/calendrun/commit/3b5d1d30cfecc548e1256dab752df5b86d702ad8))
* add vercel.json to explicitly set Next.js framework ([90017ef](https://github.com/flowcore-io/calendrun/commit/90017ef11e2364e251187f8c546b4e9abd125337))
* Clean up unused imports and improve HamburgerMenu functionality ([4a826cd](https://github.com/flowcore-io/calendrun/commit/4a826cd6526a776afdade8c708a5413e94bc2994))
* enhance club leaderboard display for doors opened ([3f92f5f](https://github.com/flowcore-io/calendrun/commit/3f92f5fd6b2cfb2577dd4b1232e6f9c153f6ea6c))
* enhance club page leaderboard error handling and improve data fetching ([86cfcc4](https://github.com/flowcore-io/calendrun/commit/86cfcc474c69862dd1a447b499eb9ff4f4fc716d))
* Improve ChallengeBackground component's mounting logic ([7ee5094](https://github.com/flowcore-io/calendrun/commit/7ee5094084f42b0d461e11321ed2cf16fc1e28fe))
* improve club leaderboard layout and add goal reached indicator ([ee2f23d](https://github.com/flowcore-io/calendrun/commit/ee2f23d246f02df370c80fd017476153f6f5f091))
* **middleware:** update matcher to exclude /health for Kubernetes probes ([6c8ab2a](https://github.com/flowcore-io/calendrun/commit/6c8ab2aa5e5c6f7ab11ff069bdac41aa5f925249))
* Migrate environment configuration to .mjs format, add type checking script, and enhance session handling for anonymous users ([308d236](https://github.com/flowcore-io/calendrun/commit/308d23699260a2e5401fc8727a9b9fb3dd859b3a))
* minor edit ([e83938c](https://github.com/flowcore-io/calendrun/commit/e83938c4591c06abd5b9a45f27675a542b617bdd))
* Rebrand and update repository references from "Calendar Running" to "CalendRun" ([3232a96](https://github.com/flowcore-io/calendrun/commit/3232a96bf32bc508b5d09ff2417710e987c53372))
* restore variantToMultiplier import in club-service ([088f5ba](https://github.com/flowcore-io/calendrun/commit/088f5ba115017b240d322804a0cb0b82349e003a))
* scope club leaderboard totals to active challenge instance ([7d38b29](https://github.com/flowcore-io/calendrun/commit/7d38b295e4e6064233e1949ffdfe4815cd726446))
* Show opened doors kms and not total kms in club overview ([8633a30](https://github.com/flowcore-io/calendrun/commit/8633a307b22acd23aa3bebf7ba1b527d722f772e))
* simplify GET request handler for club joining ([cbf6796](https://github.com/flowcore-io/calendrun/commit/cbf6796bc4e6d0f701689a7208a75329a6ca9e64))
* update application port and environment configurations ([1a7b3ab](https://github.com/flowcore-io/calendrun/commit/1a7b3ab5f42ed0917fd6d40a0d0b6ad5d9a61fbe))
* Update authentication handling to use NextAuthOptions and simplify session management in protected pages ([b800659](https://github.com/flowcore-io/calendrun/commit/b800659ae0a30f1d6c4d4e9f7d189462723df32c))
* update authentication redirects and enhance UI components ([30f6630](https://github.com/flowcore-io/calendrun/commit/30f6630b3a8c6392e19ae084a5d4bfa1ac2f7536))
* update club token handling across components and API ([95842b2](https://github.com/flowcore-io/calendrun/commit/95842b2dc5d861191380c9cd409ed18d31e2957a))
* update Faroese localization for home screen installation prompt ([ee917cf](https://github.com/flowcore-io/calendrun/commit/ee917cfcdd0817ae7c4157c14da9908f5190fab2))
* update localized footer message in Faroese ([51387b8](https://github.com/flowcore-io/calendrun/commit/51387b8251346124b65983894ba6707787011be5))
* update nextjs and react because of CVE-2025-55182 vulnerability ([85ed22d](https://github.com/flowcore-io/calendrun/commit/85ed22d710ae9efd214540581af3d401735f4d57))

## [2.0.0](https://github.com/flowcore-io/calendrun) (2025-11-27)

### Breaking Changes

* Rebranded from "Calendar Running" to "CalendRun"
* Changed repository from `flowcore-io/calendarrunning` to `flowcore-io/calendrun`
* Renamed environment variables from `CALENDARRUNNING_*` to `CALENDRUN_*`
* Switched deployment from Flowcore platform to Vercel

---

*Historical releases below reference the previous repository (flowcore-io/calendarrunning)*

## [1.6.1](https://github.com/flowcore-io/calendarrunning/compare/v1.6.0...v1.6.1) (2025-11-27)


### Bug Fixes

* **middleware:** update matcher to exclude /health for Kubernetes probes ([6c8ab2a](https://github.com/flowcore-io/calendarrunning/commit/6c8ab2aa5e5c6f7ab11ff069bdac41aa5f925249))

## [1.6.0](https://github.com/flowcore-io/calendarrunning/compare/v1.5.0...v1.6.0) (2025-11-27)


### Features

* Internationalization support. App logo. Background image on landing page. ([3e905be](https://github.com/flowcore-io/calendarrunning/commit/3e905be911d53704fe4bfcb8b0337a0367ba5fb0))

## [1.5.0](https://github.com/flowcore-io/calendarrunning/compare/v1.4.0...v1.5.0) (2025-11-27)


### Features

* Enhance user experience with new header and profile features ([055bb13](https://github.com/flowcore-io/calendarrunning/commit/055bb13412b25241625381b0356fd738453eedee))


### Bug Fixes

* Clean up unused imports and improve HamburgerMenu functionality ([4a826cd](https://github.com/flowcore-io/calendarrunning/commit/4a826cd6526a776afdade8c708a5413e94bc2994))

## [1.4.0](https://github.com/flowcore-io/calendarrunning/compare/v1.3.0...v1.4.0) (2025-11-16)


### Features

* Introduce ChallengeBackground component for improved background image handling ([ee993e2](https://github.com/flowcore-io/calendarrunning/commit/ee993e20df421d4f5d4ed3672cc5ac28f74925b2))
* Update challenge instance and run management with Usable integration ([45cc226](https://github.com/flowcore-io/calendarrunning/commit/45cc226120dd898215a94f2e0235bea7409b8f22))


### Bug Fixes

* Improve ChallengeBackground component's mounting logic ([7ee5094](https://github.com/flowcore-io/calendarrunning/commit/7ee5094084f42b0d461e11321ed2cf16fc1e28fe))

## [1.3.0](https://github.com/flowcore-io/calendarrunning/compare/v1.2.0...v1.3.0) (2025-11-16)


### Features

* Add distance planning and remaining distance calculation for challenge instances ([c3a0b02](https://github.com/flowcore-io/calendarrunning/commit/c3a0b02f64d6abd4c6564737a61f477d75cd516d))
* Implement run logging and management features for challenge instances ([6e9af7e](https://github.com/flowcore-io/calendarrunning/commit/6e9af7ea78852c33c15c6b8e725b21bdd76bae17))

## [1.2.0](https://github.com/flowcore-io/calendarrunning/compare/v1.1.0...v1.2.0) (2025-11-16)


### Features

* Enhance authentication and admin features with Keycloak integration, sign-out handling, and challenge template management ([cc7af48](https://github.com/flowcore-io/calendarrunning/commit/cc7af4855de4c50624979f80b052563b156fcfa5))

## [1.1.0](https://github.com/flowcore-io/calendarrunning/compare/v1.0.0...v1.1.0) (2025-11-16)


### Features

* Add user profile management with database schema, event handling, and API endpoints for user initialization ([8a37bc7](https://github.com/flowcore-io/calendarrunning/commit/8a37bc719724b6c5e363300659655724fd870e06))
* Implement challenge management features with database schema, event handling, and API endpoints for user interactions ([c5be8c1](https://github.com/flowcore-io/calendarrunning/commit/c5be8c16ea8937cff348f0a486dd6162411fec95))

## 1.0.0 (2025-11-16)


### Features

* Add Docker support with multi-stage builds, environment configuration, and Playwright for E2E testing ([33caa0a](https://github.com/flowcore-io/calendarrunning/commit/33caa0a2c417b8f177102b18fbde033b770bd832))
* Add initial project structure with environment configuration, authentication setup, and database health check ([23eabd5](https://github.com/flowcore-io/calendarrunning/commit/23eabd5ddc4fc8a29e649c71dd5340309d926d22))
* Implement user profile initialization and theme management with seasonal themes ([c09ebd7](https://github.com/flowcore-io/calendarrunning/commit/c09ebd7c445a24b0d0945aa9e15f1017fbc82913))


### Bug Fixes

* Migrate environment configuration to .mjs format, add type checking script, and enhance session handling for anonymous users ([308d236](https://github.com/flowcore-io/calendarrunning/commit/308d23699260a2e5401fc8727a9b9fb3dd859b3a))
* Update authentication handling to use NextAuthOptions and simplify session management in protected pages ([b800659](https://github.com/flowcore-io/calendarrunning/commit/b800659ae0a30f1d6c4d4e9f7d189462723df32c))
