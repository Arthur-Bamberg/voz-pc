import { homedir } from "node:os";
import { ensureSidecars } from "../infra/shared/ensure-sidecars.js";
import { createFsSidecarDeps } from "../infra/shared/node-fs.js";
import { getAppDataDir } from "../infra/shared/paths.js";

const appDataDir = getAppDataDir(homedir(), process.platform);
console.log(`Baixando sidecars para ${appDataDir} ...`);
const paths = await ensureSidecars(createFsSidecarDeps(appDataDir, process.platform));
console.log(JSON.stringify(paths, null, 2));
