import { rmSync } from "node:fs";
import { WORK_DIR } from "./paths";

rmSync(WORK_DIR, { recursive: true, force: true });
console.log(`Removed ${WORK_DIR}`);
