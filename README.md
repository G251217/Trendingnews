# 昨日热点

这是一个不依赖 ChatGPT 登录的 GitHub Pages 网站。页面从 `data/daily-news.json` 读取前一自然日的政策、机器人和商业机会榜单，支持三类标签筛选、站内摘要和原文跳转。

## 自动更新

GitHub Actions 在北京时间每天 00:10 运行 `scripts/collect-news.mjs`：从中国政府网、工业和信息化部、国家发展改革委的公开栏目抓取标有目标日期的链接，按主题相关性和来源权威性排序，去重后保留最多十条。采集为空时，保留上一次成功榜单，不伪造新内容。

## 文件职责

本项目没有 class：

- `index.html` 定义榜单、筛选和详情弹窗的结构。
- `app.js` 负责加载榜单、按标签筛选和展示详情。
- `styles.css` 负责桌面及移动端视觉样式。
- `scripts/collect-news.mjs` 负责北京时间日期计算、抓取、分类、排序、去重和回退数据写入。
- `data/daily-news.json` 是页面读取的已生成榜单。
- `.github/workflows/daily-news.yml` 负责定时更新数据并部署 GitHub Pages。
- `tests/smoke.mjs` 验证页面结构、榜单数据依赖和已生成条目的基本完整性。

## 发布

推送至 `main` 后，GitHub Actions 自动部署。若这是仓库首次使用 Pages，请在仓库 Settings → Pages 中将 Source 设为 **GitHub Actions**。
