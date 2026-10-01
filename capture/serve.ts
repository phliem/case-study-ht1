import { BUILDS, prepareBuild, type ServedBuild, serveBuild } from "./builds";

async function main() {
  const served: ServedBuild[] = [];
  const stopAll = () => Promise.all(served.map((build) => build.stop()));
  process.once("SIGINT", () => {
    void stopAll().then(() => process.exit(130));
  });
  for (const build of BUILDS.map(prepareBuild)) served.push(await serveBuild(build));
  for (const build of served) {
    console.log(`${build.version} (${build.fullCommit.slice(0, 10)}): ${build.url}`);
  }
  console.log("Serving both builds. Press Ctrl+C to stop.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
