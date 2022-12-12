
# Change Log

[BACK TO MAIN README](README.md)

All notable changes to the corkscrew rpm will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

---

## [0.17.2] - (12-12-2022)

- extend and isolate OpenApi types

---

## [0.17.1] - (11-6-2022)

- continue to clean up rest/debug logging

---

## [0.17.0] - (11-4-2022)

- Latest NEXT/CM integration
- big improvements to rest debug logging
  - debugging only provided relevant details
- better http timing integration
- full deps updates
  - node v16
  - ts v4.8

---

## [0.16.0] - (10-5-2022)

NEXT integration branch -> abandoned

---

## [0.15.1] - (07-25-2022)

- branch off NEXT connectivity from mgmtClient/f5Client
  - Solves this issue:<https://github.com/f5devcentral/vscode-f5/issues/179>

---

## [0.13.1] - (03-18-2022)

- [bug] schema inject changes declaration to "dec" #20
  - <https://github.com/f5devcentral/f5-conx-core/issues/20>
- tweak logger for telemetry
- updated extHttp https agent to always be configured
  - without rejectUnAuthorized=false, it would not get configured and cause logging errors

---

## [0.13.0] - (02-10-2022)

- updated deps
- refactor and extend atc models for stronger typing
  - Mainly DO
- special auth token testing

---

## [0.12.4] - (01-19-2022)

- fix as3 delete
- add function to extract tenant/schemaVersion/target from declaration

## [0.12.3] - (01-19-2022)

- fix exports again

---

## [0.12.2] - (01-19-2022)

- re-export atc schema inject

---

## [0.12.1] - (01-18-2022)

- updated deps + axios
  - should cover recent CVE-2022-0155
    - <https://github.com/advisories/GHSA-74fj-2j2h-c42q>

---

## [0.12.0] - (12-21-2021)

- updated as3 class extension to parse/hold as3 declarations for easy access/listing
- configured atc schema inject/remove function from vscode-f5
- cf class support
  - full info/inspect/declare/trigger/reset endpoint support
- consolidated ATC models and mocks to export tests for integration with other tools
- fixed download functions to create f5_cache directory if not present

---

## [0.11.0] - (11-14-2021)

- added cookie insert to BIGIP mgmt client.  This is for injecting auth cookie for UDF
  - <https://github.com/f5devcentral/f5-conx-core/issues/1>
- fixed atc versions update test
  - <https://github.com/f5devcentral/f5-conx-core/issues/13>
- option to enable/disable cert verification
  - <https://github.com/f5devcentral/f5-conx-core/issues/2>

---

## [0.10.0] - (06-10-2021)

- added journal length to logging output
  - this is to see how the singleton instance is working across projects using the logger
- updated tests to utilize new logger
- added test rest server
  - this is the beginning of something that the multipart download tests can run against
    - these tests currently require an f5 to complete
  - this test rest server can be expanded to handle many other scenarios like nock
  - this also included vscode lunch configuration for starting and debugging the rest server
- added DO rpm v1.19.0-2 to testing artifacts since it is a couple of Mb (not too small, not too big)
- looking into building packages (npm pack) to upload as releases
  - these releases will produces "tags" for the version and allow for private versioning without publishing to NPM
- finished DO class methods/functions
- Moved more as3 models/functions from vscode-f5 (re-imported/re-factored)
- configured TEEM agent inject to as3/do declartion post
- added schema and examples endpoints to atcMetaData constants
- updated f5Client.discover to output DiscoverInfo
