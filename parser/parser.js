import fs from "fs";
import readline from "readline";

const INPUT = "./result/input.json";
const OUTPUT = "./result/output.json";
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

async function fetchWithRetry(id) {
  while (true) {
    try {
      const res = await fetch(BASE + id, {
        headers: {
          "User-Agent": "MyAnimeParser",
        },
      });

      if (!res.ok) {
        console.log(`HTTP ${res.status} — retrying...`);
        await sleep(2000);
        continue;
      }

      return await res.json();
    } catch {
      console.log("Network error — retrying...");
      await sleep(2000);
    }
  }
}

async function main() {
  const raw = fs.readFileSync(INPUT, "utf8");
  const list = JSON.parse(raw);

  const total = list.length;
  const result = [];

  let success = 0;

  console.log(`Start parsing ${total} anime...\n`);

  for (let i = 0; i < total; i++) {
    const anime = list[i];
    const id = anime.target_id;
    const userScore = anime.score;
    const userStatus = anime.status;

    const progress = `${i + 1}/${total}`;
    const percent = Math.round(((i + 1) / total) * 100);

    process.stdout.write(`[${progress}] (${percent}%) Fetching ${id}... `);

    try {
      const data = await fetchWithRetry(id);

      result.push({
        id: data.id,
        title: data.name,
        title_ru: data.russian,

        type: data.kind, // tv / movie / ova / ona / special

        user_score: userScore,
        shiki_score: data.score,
        episodes: data.episodes,
        year: data.aired_on?.slice(0, 4),
        user_stauts: userStatus,

        studios: data.studios.map((s) => s.name),

        poster: data.image.original,
        genres: data.genres.map((g) => g.russian),
        description: data.description,
      });

      success++;
      console.log("SUCCESS");
    } catch {
      console.log("ERROR (network)");
      failed++;
      failedIds.push(id);
    }

    await sleep(2000);
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
