const expected = (process.env.EXPECTED_SHA || "").trim();
const base = (process.env.PRODUCTION_URL || "https://imagealchemy.app").replace(/\/$/, "");
const attempts = Number(process.env.PRODUCTION_ATTEMPTS || 12);
const intervalMs = Number(process.env.PRODUCTION_INTERVAL_MS || 10000);

if (!expected) {
  console.error("EXPECTED_SHA is required.");
  process.exit(2);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (let attempt = 1; attempt <= attempts; attempt++) {
  const url = `${base}/deploy-version.json?expected=${encodeURIComponent(expected)}&t=${Date.now()}`;
  try {
    const response = await fetch(url, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
      redirect: "follow",
    });

    if (response.ok) {
      const meta = await response.json();
      const liveSha = typeof meta.sha === "string" ? meta.sha.trim() : "";
      console.log(
        `Production check ${attempt}/${attempts}: live=${liveSha || "missing"} expected=${expected}`,
      );
      if (liveSha === expected) {
        console.log(`Production is synchronized: ${base} is serving ${expected.slice(0, 12)}.`);
        process.exit(0);
      }
    } else {
      console.log(`Production check ${attempt}/${attempts}: HTTP ${response.status}`);
    }
  } catch (error) {
    console.log(
      `Production check ${attempt}/${attempts}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (attempt < attempts) await sleep(intervalMs);
}

console.error(
  `Production is stale: ${base} is not serving main commit ${expected}. In Lovable, use Publish > Publish changes. Lovable native hosting does not auto-publish future GitHub changes.`,
);
process.exit(1);
