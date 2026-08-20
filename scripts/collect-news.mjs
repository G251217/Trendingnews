import { mkdir, readFile, writeFile } from "node:fs/promises";

const graduatePolicyTerms = ["高校毕业生", "毕业生", "应届", "就业", "求职", "招聘", "实习", "见习", "职业培训", "技能培训", "创业", "社保", "社会保险", "医保", "住房", "租房", "公积金", "落户", "补贴", "税费", "高校", "学生", "助学", "学位", "学历", "青年", "人才"];
const topics = { "机器人": ["机器人", "具身智能", "智能制造", "人工智能", "自动化"], "赚钱风口": ["投资", "融资", "产业", "企业", "消费", "市场", "创业", "基金"] };
const sources = [{ name: "济南市人力资源和社会保障局", url: "https://jnhrss.jinan.gov.cn/", weight: 6 }, { name: "济南住房公积金中心", url: "https://gjj.jinan.gov.cn/", weight: 6 }, { name: "杭州市人力资源和社会保障局", url: "https://hrss.hangzhou.gov.cn/", weight: 6 }, { name: "中国政府网", url: "https://www.gov.cn/zhengce/index.htm", weight: 3 }, { name: "人力资源和社会保障部", url: "https://www.mohrss.gov.cn/SYrlzyhshbzb/zwgk/zcwj/", weight: 4 }, { name: "工业和信息化部", url: "https://www.miit.gov.cn/zwgk/zcwj/wjfb/index.html", weight: 3 }, { name: "国家发展改革委", url: "https://www.ndrc.gov.cn/xwdt/tzgg/", weight: 2 }];
const targetDate = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });
const text = (value) => value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const tagsFor = (title) => {
  const tags = Object.entries(topics).filter(([, words]) => words.some((word) => title.includes(word))).map(([tag]) => tag);
  if (graduatePolicyTerms.some((word) => title.includes(word))) tags.unshift("政策");
  return [...new Set(tags)];
};
function parse(html, source, date) { const results = []; const expression = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi; for (const match of html.matchAll(expression)) { const titleAttribute = match[0].match(/\btitle=["']([^"']+)["']/i); const title = text(titleAttribute?.[1] ?? match[2]); const tags = tagsFor(title); const index = match.index ?? 0; const context = html.slice(Math.max(0, index - 240), index + match[0].length + 240); const isGraduatePolicy = tags.includes("政策"); const city = source.name.startsWith("济南") ? "济南" : source.name.startsWith("杭州") ? "杭州" : ""; if (!context.includes(date) || title.length < 12 || title.length > 70 || title.endsWith("。") || tags.length === 0) continue; const url = new URL(match[1], source.url).toString(); const summary = isGraduatePolicy ? `${city ? `面向${city}` : "与"}毕业求职或独立生活直接相关的${source.name}公开资讯。` : `来自${source.name}的公开信息，已按主题相关性纳入今日热点候选。`; if (!results.some((item) => item.url === url || item.title === title)) results.push({ title, source: source.name, publishedAt: date, summary, tags, url, score: source.weight + tags.length + (isGraduatePolicy ? 8 : 0) + (city ? 4 : 0) }); } return results; }
const existing = async () => JSON.parse(await readFile("data/daily-news.json", "utf8"));
const date = targetDate();
const collected = (await Promise.all(sources.map(async (source) => { try { const response = await fetch(source.url, { headers: { "user-agent": "Trendingnews/1.0" } }); return response.ok ? parse(await response.text(), source, date) : []; } catch { return []; } }))).flat().sort((a, b) => b.score - a.score).filter((item, index, all) => all.findIndex((candidate) => candidate.title === item.title) === index).slice(0, 10);
const previous = await existing();
const previousItems = previous.items.map((item) => ({ ...item, tags: tagsFor(item.title) })).filter((item) => item.tags.length);
const items = collected.length ? collected.map(({ score, ...item }, index) => ({ id: `${date}-${index + 1}`, rank: index + 1, ...item })) : previousItems;
await mkdir("data", { recursive: true });
await writeFile("data/daily-news.json", `${JSON.stringify({ targetDate: collected.length ? date : previous.targetDate, status: collected.length ? "已按北京时间汇总今日资讯；就业优先济南与杭州机会" : "今日采集暂不可用，正在展示最近一次成功榜单", items }, null, 2)}\n`);
