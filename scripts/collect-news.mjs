import { mkdir, readFile, writeFile } from "node:fs/promises";

const topics = { "政策": ["政策", "通知", "意见", "方案", "规划", "行动", "办法", "支持"], "机器人": ["机器人", "具身智能", "智能制造", "人工智能", "自动化"], "赚钱风口": ["投资", "融资", "产业", "企业", "消费", "市场", "创业", "基金"] };
const sources = [{ name: "中国政府网", url: "https://www.gov.cn/zhengce/index.htm", weight: 3 }, { name: "工业和信息化部", url: "https://www.miit.gov.cn/zwgk/zcwj/wjfb/index.html", weight: 3 }, { name: "国家发展改革委", url: "https://www.ndrc.gov.cn/xwdt/tzgg/", weight: 2 }];
const targetDate = () => { const now = new Date(); const china = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Shanghai" })); china.setDate(china.getDate() - 1); return china.toISOString().slice(0, 10); };
const text = (value) => value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const tagsFor = (title) => Object.entries(topics).filter(([, words]) => words.some((word) => title.includes(word))).map(([tag]) => tag);
function parse(html, source, date) { const results = []; const expression = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi; for (const match of html.matchAll(expression)) { const title = text(match[2]); const tags = tagsFor(title); const index = match.index ?? 0; const context = html.slice(Math.max(0, index - 240), index + match[0].length + 240); if (!context.includes(date) || title.length < 12 || title.length > 100 || tags.length === 0) continue; const url = new URL(match[1], source.url).toString(); if (!results.some((item) => item.url === url || item.title === title)) results.push({ title, source: source.name, publishedAt: date, summary: `来自${source.name}的公开信息，已按主题相关性纳入昨日热点候选。`, tags, url, score: source.weight + tags.length }); } return results; }
const existing = async () => JSON.parse(await readFile("data/daily-news.json", "utf8"));
const date = targetDate();
const collected = (await Promise.all(sources.map(async (source) => { try { const response = await fetch(source.url, { headers: { "user-agent": "Trendingnews/1.0" } }); return response.ok ? parse(await response.text(), source, date) : []; } catch { return []; } }))).flat().sort((a, b) => b.score - a.score).filter((item, index, all) => all.findIndex((candidate) => candidate.title === item.title) === index).slice(0, 10);
const previous = await existing();
const items = collected.length ? collected.map(({ score, ...item }, index) => ({ id: `${date}-${index + 1}`, rank: index + 1, ...item })) : previous.items;
await mkdir("data", { recursive: true });
await writeFile("data/daily-news.json", `${JSON.stringify({ targetDate: collected.length ? date : previous.targetDate, status: collected.length ? "已按北京时间汇总昨日公开权威资讯" : "昨日采集暂不可用，正在展示最近一次成功榜单", items }, null, 2)}\n`);
