import path from 'node:path'
import { promises as fs } from 'node:fs'
import { createWriteStream } from 'node:fs'
import yazl from 'yazl'

function isHidden(p: string) {
  // skip dotfiles like .DS_Store
  return path.basename(p).startsWith('.')
}

// Recursive walker that yields files relative to root
async function* walk(dir: string, relBase = ''): AsyncGenerator<{ full: string; rel: string }> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    const rel = path.join(relBase, e.name)
    if (isHidden(rel)) continue // don't include dotfiles
    if (e.isDirectory()) {
      yield* walk(full, rel)
    } else if (e.isFile()) {
      yield { full, rel }
    }
  }
}

/**
 * Create a .pkpass ZIP from the payload directory, equivalent to:
 *   zip -r -X out.pkpass .
 * Notes:
 *  - No extra attributes/resource forks (we skip dotfiles).
 *  - mtime fixed for determinism (similar spirit to -X).
 */
export async function zipPkpassDir(payloadDir: string, outFile: string): Promise<string> {
  await fs.mkdir(path.dirname(outFile), { recursive: true })

  const zipfile = new yazl.ZipFile()
  const out = createWriteStream(outFile)

  const done = new Promise<void>((resolve, reject) => {
    out.on('close', () => resolve())
    out.on('error', reject)
  })

  zipfile.outputStream.pipe(out)

  // Add files at the ROOT of the archive (no parent folder)
  for await (const { full, rel } of walk(payloadDir)) {
    // Use addFile so we don't load everything in memory
    zipfile.addFile(full, rel, {
      // normalize metadata; avoids weird attrs across platforms
      mtime: new Date(0),            // epoch
      mode: 0o100644,                // regular file, 0644
      compress: true,                // DEFLATE (ok for pkpass)
    })
  }

  zipfile.end()
  await done
  return outFile
}
