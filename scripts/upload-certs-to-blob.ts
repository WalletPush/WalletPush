import fs from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

function checkToken() {
  const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
  if (!TOKEN) {
    console.error("❌ BLOB_READ_WRITE_TOKEN is required");
    console.error("Set it as an environment variable or add it to .env.local:");
    console.error("export BLOB_READ_WRITE_TOKEN=\"your_vercel_blob_token\"");
    console.error("or");
    console.error("echo 'BLOB_READ_WRITE_TOKEN=your_vercel_blob_token' >> .env.local");
    process.exit(1);
  }
  return TOKEN;
}

const ROOT = path.resolve("private/certificates");
const OUT = path.resolve("scripts/blob-certs-manifest.json");
const DRY = process.env.DRY_RUN === "1";

type Row = {
  identifier: string;
  p12_local: string;
  p12_blob_url: string;
  wwdr_local?: string | null;
  wwdr_blob_url?: string | null;
};

function walk(dir: string, out: string[] = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

async function uploadFile(localPath: string, key: string, token: string) {
  if (DRY) return { url: `dry://${key}` };
  const stream = fs.createReadStream(localPath);
  const res = await put(key, stream, { access: "public", token });
  return res;
}

(async () => {
  const TOKEN = checkToken();
  
  if (!fs.existsSync(ROOT)) throw new Error(`Folder not found: ${ROOT}`);

  const files = walk(ROOT).filter(p =>
    p.toLowerCase().endsWith(".p12") ||
    /wwdr/i.test(p) && (p.toLowerCase().endsWith(".cer") || p.toLowerCase().endsWith(".pem"))
  );

  const byIdentifier = new Map<string, { p12?: string; wwdr?: string }>();

  for (const f of files) {
    const rel = path.relative(ROOT, f);
    const parts = rel.split(path.sep);
    const identifier = parts.length > 1 ? parts[0] : path.parse(f).name;
    const entry = byIdentifier.get(identifier) || {};
    if (f.toLowerCase().endsWith(".p12")) entry.p12 = f;
    else entry.wwdr = f;
    byIdentifier.set(identifier, entry);
  }

  const rows: Row[] = [];

  for (const [identifier, { p12, wwdr }] of Array.from(byIdentifier.entries())) {
    if (!p12) { 
      console.warn(`⚠️  No .p12 for ${identifier}, skipping`); 
      continue; 
    }

    const p12Key = `certificates/${identifier}/${path.basename(p12)}`;
    const p12Res = await uploadFile(p12, p12Key, TOKEN);

    let wwdrUrl: string | null = null;
    if (wwdr) {
      const wwdrKey = `certificates/${identifier}/${path.basename(wwdr)}`;
      const wwdrRes = await uploadFile(wwdr, wwdrKey, TOKEN);
      wwdrUrl = wwdrRes.url;
    }

    rows.push({
      identifier,
      p12_local: p12,
      p12_blob_url: p12Res.url,
      wwdr_local: wwdr || null,
      wwdr_blob_url: wwdrUrl
    });

    console.log(`✅ ${identifier}:`);
    console.log(`   p12  → ${p12Res.url}`);
    if (wwdrUrl) console.log(`   WWDR → ${wwdrUrl}`);
  }

  fs.writeFileSync(OUT, JSON.stringify(rows, null, 2));
  console.log(`\n📄 Manifest saved → ${OUT}`);
  console.log(`Rows: ${rows.length}`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
