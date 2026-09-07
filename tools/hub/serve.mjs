import { createServer } from "node:http";

const PORT = process.env.HUB_PORT || 8080;

const LINKS = [
  { group: "Storefronts", items: [
    { name: "Casewin", sub: "Phone & laptop cases", url: "http://localhost:3000", niche: "cases" },
    { name: "Meridian Optic", sub: "Sunglasses & blue-light", url: "http://localhost:3001", niche: "eyewear" },
    { name: "Odd Shelf", sub: "Figures, puzzles & models", url: "http://localhost:3002", niche: "toys" },
    { name: "Kesten", sub: "Automatic & quartz watches", url: "http://localhost:3003", niche: "watches" },
  ]},
  { group: "Operations", items: [
    { name: "Medusa Admin", sub: "Products · orders · suppliers · P&L", url: "http://localhost:9000/app", niche: "admin" },
    { name: "Store API health", sub: "GET /health", url: "http://localhost:9000/health", niche: "api" },
  ]},
];

const html = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Workspace — Web Product Project</title>
<style>
  :root{--bg:#0d0e10;--card:#17191c;--bd:#26292e;--fg:#eceae5;--mut:#9a978f;--ok:#3fbf72;--down:#e5533d}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
  .wrap{max-width:1040px;margin:0 auto;padding:56px 20px 80px}
  h1{font:600 26px/1.2 Georgia,"Times New Roman",serif;letter-spacing:.01em;margin:0}
  .lede{color:var(--mut);margin:6px 0 40px}
  .grp{margin-bottom:36px}
  .grp h2{font:600 11px/1 inherit;letter-spacing:.18em;text-transform:uppercase;color:var(--mut);margin:0 0 14px}
  .grid{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}
  a.card{display:block;text-decoration:none;color:inherit;background:var(--card);border:1px solid var(--bd);
    border-radius:6px;padding:18px 18px 16px;transition:border-color .18s,transform .18s}
  a.card:hover{border-color:#3a3f46;transform:translateY(-2px)}
  .name{font-weight:600;display:flex;align-items:center;gap:8px}
  .sub{color:var(--mut);font-size:13px;margin-top:3px}
  .url{color:var(--mut);font-size:12px;margin-top:12px;font-family:ui-monospace,Menlo,Consolas,monospace}
  .dot{width:8px;height:8px;border-radius:50%;background:#555;flex:0 0 auto}
  .dot.up{background:var(--ok)} .dot.down{background:var(--down)}
  footer{color:var(--mut);font-size:12px;margin-top:48px}
  code{background:#000;padding:2px 6px;border-radius:3px;font-size:12px}
</style></head><body><div class="wrap">
<h1>Web Product Project — Workspace</h1>
<p class="lede">One Medusa backend, several single-niche storefronts. Each storefront is the same code with a different <code>SITE</code>.</p>
${LINKS.map(g => `<div class="grp"><h2>${g.group}</h2><div class="grid">${g.items.map(i => `
  <a class="card" href="${i.url}" target="_blank" rel="noopener" data-url="${i.url}">
    <div class="name"><span class="dot" data-check></span>${i.name}</div>
    <div class="sub">${i.sub}</div>
    <div class="url">${i.url.replace("http://","")}</div>
  </a>`).join("")}</div></div>`).join("")}
<footer>Run everything: <code>npm run sites</code> (storefronts) &amp; <code>npm run backend:dev</code> (Medusa). This page: <code>npm run hub</code>.</footer>
</div>
<script>
  async function ping(card){
    const dot = card.querySelector("[data-check]");
    try{
      await fetch(card.dataset.url, { mode:"no-cors", cache:"no-store" });
      dot.className = "dot up";
    }catch{ dot.className = "dot down"; }
  }
  const cards = [...document.querySelectorAll("a.card")];
  const tick = () => cards.forEach(ping);
  tick(); setInterval(tick, 5000);
</script>
</body></html>`;

createServer((_req, res) => {
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
}).listen(PORT, () => {
  console.log(`\n  Workspace hub  →  http://localhost:${PORT}\n`);
});
