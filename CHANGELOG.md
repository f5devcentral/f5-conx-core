
# Change Log

[BACK TO MAIN README](README.md)

All notable changes to the corkscrew rpm will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

---

## [0.10.0] - (06-02-2021)

- added journal length to logging output
  - this is so i can see how the singleton instance is workign across projects using the logger
- updated tests to utilize new logger
- added test rest server
  - this is the beginning of something that the multipart download tests can run against
    - these tests currently require an f5 to complete
  - this test rest server can be expanded to handle many other scenarios like nock
  - this also included vscode lunch configuration for starting and debugging the rest server
- added DO rpm v1.19.0-2 to testing artifacts since it is a couple of Mb (not too small, not too big)
- looking into building packages (npm pack) to upload as releases
  - these releases will produces "tags" for the version and allow for private versioning without publishing to NPM
- finished DO class
- Moved more as3 models/functions from vscode-f5 (re-imported/re-factored)
