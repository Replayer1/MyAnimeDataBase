import fs from "fs";
import readline from "readline";

const OUTPUT = "./manual_output.json";
const BASE = "https://shikimori.one/api/animes/";

const MANUAL_IDS = [32902];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function waitForKey() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("\nPress ENTER to exit...", () => {
      rl.close();
      resolve();
    });
  });
}

async function main() {
  const total = MANUAL_IDS.length;

  if (!total) {
    console.log("No IDs provided.");
    await waitForKey();
    return;
  }

  const result = [];
  const failedIds = [];

  console.log(`Manual parsing ${total} anime...\n`);

  for (let i = 0; i < total; i++) {
    const id = MANUAL_IDS[i];

    const progress = `${i + 1}/${total}`;
    const percent = Math.round(((i + 1) / total) * 100);

    process.stdout.write(`[${progress}] (${percent}%) Fetching ${id}... `);

    try {
      const res = await fetch(BASE + id, {
        headers: {
          "User-Agent": "MyAnimeParser",
        },
      });

      if (!res.ok) {
        console.log(`ERROR (HTTP ${res.status})`);
        failedIds.push(id);
        continue;
      }

      const data = await res.json();

      result.push({
        id: data.id,
        title: data.name,
        title_ru: data.russian,
        score: data.score,
        episodes: data.episodes,
        year: data.aired_on?.slice(0, 4),
        poster: data.image.original,
        genres: data.genres.map((g) => g.name),
        description: data.description,
      });

      console.log("SUCCESS");
    } catch {
      console.log("ERROR (network)");
      failedIds.push(id);
    }

    await sleep(800);
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2));

  console.log("\n========== SUMMARY ==========");
  console.log(`Total: ${total}`);
  console.log(`Success: ${result.length}`);
  console.log(`Failed: ${failedIds.length}`);

  if (failedIds.length) {
    console.log("Failed IDs:");
    console.log(failedIds.join(", "));
  }

  console.log("=============================");

  await waitForKey();
}

main();
