/**
 * Smoke checks for local/CI — does not require auth for /api/health.
 * Usage: npx tsx scripts/smoke.ts [baseUrl]
 */
const base = (process.argv[2] || process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);

async function check(path: string, expectStatus: number) {
  const url = `${base}${path}`;
  const res = await fetch(url, { redirect: "manual" });
  const ok = res.status === expectStatus;
  console.log(
    `${ok ? "OK" : "FAIL"} ${path} → ${res.status} (expected ${expectStatus})`,
  );
  return ok;
}

async function main() {
  const results = await Promise.all([
    check("/api/health", 200),
    check("/api/schedule", 401),
    check("/api/patients", 401),
    check("/login", 200),
  ]);

  const failed = results.filter((r) => !r).length;
  if (failed) {
    console.error(`Smoke failed: ${failed} check(s)`);
    process.exit(1);
  }
  console.log("Smoke passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
