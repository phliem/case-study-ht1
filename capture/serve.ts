import { parseCaptureArgs } from "./args";
import { BUILDS, prepareBuild, type ServedBuild, serveBuild } from "./builds";
import { buildsFor } from "./pages";

async function main() {
  const { pages } = parseCaptureArgs(process.argv.slice(2));
  const served: ServedBuild[] = [];
  const stopAll = () => Promise.all(served.map((build) => build.stop()));
  process.once("SIGINT", () => {
    void stopAll().then(() => process.exit(130));
  });
  for (const name of buildsFor(pages)) served.push(await serveBuild(prepareBuild(BUILDS[name])));
  for (const build of served) {
    console.log(`${build.name} (${build.fullCommit.slice(0, 10)}): ${build.url}`);
  }
  console.log("Serving. Press Ctrl+C to stop.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
