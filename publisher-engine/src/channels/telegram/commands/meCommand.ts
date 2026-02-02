import fs from 'fs/promises';
import path from 'path';

/**
 * Atomic write: write to temp file, then rename
 * Prevents corruption if process crashes mid-write
 */
export async function atomicWriteJSON(
  filePath: string,
  data: any
): Promise<void> {
  const dir = path.dirname(filePath);
  const tempPath = path.join(dir, `.${path.basename(filePath)}.tmp`);

  try {
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(tempPath, filePath);
  } catch (error) {
    // Clean up temp file on error
    try {
      await fs.unlink(tempPath);
    } catch {}
    throw error;
  }
}

