# Read-only QA of the live free compressor

No code edits, commits, or deploys. Everything runs from /tmp; the project stays untouched. No Stripe interaction.

## Checks (each reported PASS/FAIL with evidence)
1. Upload a temporary PNG and JPEG on https://imagealchemy.app in a fresh Chromium context, then select the Web (WebP) preset.
2. Compress both and wait for "2 done". Take screenshots.
3. ZIP download: confirm it has 2 distinct entries and that each decodes with Pillow. Record format, dimensions and byte size.
4. Individual download: confirm 2 separate files arrive and decode, with sizes compared against the source files.
5. Edge cases:
   - Add the same file twice (duplicate).
   - Add a corrupt PNG.
   - Add a 0-byte file.
   - For each, record the exact toast or error text and the queue count.
6. Load the page at 390px mobile width and compare scrollWidth with clientWidth to check for sideways scrolling.
7. Collect console and page errors for the whole run.

## Evidence
Screenshots go in /tmp/browser/qa3/shots/ (1_uploaded, 2_done, 3_edge, 4_mobile). Downloads go in /tmp/browser/qa3/dl/. Results are reported exactly as observed, with no fabricated passes.

## Technical note
Plan mode blocked writing the test script, even under /tmp. Approving this plan lets the run go ahead.
