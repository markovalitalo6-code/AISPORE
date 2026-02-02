
import fs from "fs";
import path from "path";

const outDir = path.resolve(process.cwd(), "exports");
function fileName(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return path.join(outDir, `audit_${y}-${m}-${day}.log`);
}

export function audit(line: string){
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.appendFileSync(fileName(), line + "\n", "utf8");
}
