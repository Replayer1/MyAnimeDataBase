import fs from "fs";
import readline from "readline";

const INPUT = "./input.json";
const OUTPUT = "./output.json";
const BASE = "https://shikimori.one/api/animes/";

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
  const raw = fs.readFileSync(INPUT, "utf8");
  const list = JSON.parse(raw);

  const total = list.length;
  const result = [];

  let success = 0;
  let failed = 0;
  const failedIds = [];

  console.log(`Start parsing ${total} anime...\n`);

  for (let i = 0; i < total; i++) {
    const anime = list[i];
    const id = anime.target_id;

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
        failed++;
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

      success++;
      console.log("SUCCESS");
    } catch {
      console.log("ERROR (network)");
      failed++;
      failedIds.push(id);
    }

    await sleep(800);
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2));

  console.log("\n========== SUMMARY ==========");
  console.log(`Total requests: ${total}`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);

  if (failedIds.length) {
    console.log("Failed IDs:");
    console.log(failedIds.join(", "));
  }

  console.log("=============================");

  await waitForKey();
}

main();
