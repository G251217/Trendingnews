import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), "utf8");

test("homepage contains the news surface and its data dependency", async () => {
  const [html, script, data] = await Promise.all([read("index.html"), read("app.js"), read("data/daily-news.json")]);
  const feed = JSON.parse(data);
  assert.match(html, /今日榜单/);
  assert.match(html, /优先济南、杭州毕业求职与生活资讯/);
  assert.match(html, /data-topic="机器人"/);
  assert.match(script, /fetch\('data\/daily-news.json'\)/);
  assert.match(await read("scripts/collect-news.mjs"), /graduatePolicyTerms/);
  assert.match(await read("scripts/collect-news.mjs"), /previousItems/);
  assert.match(await read("scripts/collect-news.mjs"), /济南市人力资源和社会保障局/);
  assert.match(await read("scripts/collect-news.mjs"), /济南住房公积金中心/);
  assert.match(await read("scripts/collect-news.mjs"), /杭州市人力资源和社会保障局/);
  assert.ok(feed.items.length > 0 && feed.items.length <= 10);
  assert.ok(feed.items.every((item) => !item.title.includes("...")));
  assert.ok(feed.items.every((item) => item.url.startsWith("https://") && item.tags.length > 0));
});
