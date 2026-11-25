// Verify all locale files share the same answer count and ui keys,
// since js/app.js maps answers across locales by index.
import { readFileSync, readdirSync } from "node:fs";
import assert from "node:assert/strict";

const dir = new URL("../locales/", import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();

try {
  assert.ok(files.length > 0, "no locale files found in locales/");
  const locales = files.map((file) => {
    let data;
    try {
      data = JSON.parse(readFileSync(new URL(file, dir), "utf8"));
    } catch (error) {
      assert.fail(`${file}: invalid JSON (${error.message})`);
    }
    // Same checks as loadLocale() in js/app.js
    assert.ok(data?.meta?.lang, `${file}: missing meta.lang`);
    assert.ok(data?.ui, `${file}: missing ui`);
    assert.ok(Array.isArray(data.answers) && data.answers.length > 0, `${file}: answers must be a non-empty array`);
    return { file, count: data.answers.length, uiKeys: Object.keys(data.ui).sort() };
  });

  const [ref] = locales;
  for (const loc of locales.slice(1)) {
    assert.equal(loc.count, ref.count, `${loc.file}: has ${loc.count} answers, ${ref.file} has ${ref.count}`);
    assert.deepEqual(loc.uiKeys, ref.uiKeys, `${loc.file}: ui keys differ from ${ref.file}`);
  }

  console.log(`OK: ${files.length} locales (${files.join(", ")}), ${ref.count} answers each, ${ref.uiKeys.length} ui keys`);
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}
