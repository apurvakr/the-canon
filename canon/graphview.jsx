/* global React */
/* =========================================================================
   THE GRAPH — a 3-D rotating globe of the whole canon.
   Nodes = papers, arranged on a sphere with each cluster forming a coloured
   region. Links = curated idea-threads (CANON_EDGES) + shared-tag affinities.
   The globe auto-rotates; drag to spin, scroll to zoom, hover to light up a
   paper's connections, click for a detail panel.
   ========================================================================= */
const { useRef: useRefG, useState: useStateG, useEffect: useEffectG, useMemo: useMemoG } = React;

const INK = "#1B1813";

function gShortTitle(t) {
  let s = t.replace(/\s*\(.*$/, "").trim();      // drop parenthetical chapter notes
  if (s.length > 30) s = s.slice(0, 28).trim() + "…";
  return s;
}
function hexToRgb(h) {
  const m = h.replace("#", "");
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
}

/* ---- build the static graph model (3-D nodes, links, adjacency) ---- */
function buildGraph(papers, clusters, edges) {
  const order = Object.keys(clusters);
  const R = 300;                       // sphere radius (world units)
  const k = order.length;

  // cluster anchors spread evenly over the sphere (Fibonacci distribution)
  const anchor = {};
  order.forEach((name, i) => {
    const y = 1 - (i / (k - 1)) * 2;   // 1 → -1
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * 2.399963;        // golden angle
    anchor[name] = { x: Math.cos(theta) * rad * R, y: y * R, z: Math.sin(theta) * rad * R };
  });

  const nodes = papers.map((p) => {
    const a = anchor[p.cluster] || { x: 0, y: 0, z: 0 };
    let x = a.x + (Math.random() - 0.5) * 120;
    let y = a.y + (Math.random() - 0.5) * 120;
    let z = a.z + (Math.random() - 0.5) * 120;
    const d = Math.hypot(x, y, z) || 1;
    x = x / d * R; y = y / d * R; z = z / d * R;     // project onto shell
    return {
      id: p.id, paper: p, cluster: p.cluster, color: clusters[p.cluster].color,
      x, y, z, vx: 0, vy: 0, vz: 0, deg: 0, r: 5,
      sx: 0, sy: 0, sr: 5, sz: 0
    };
  });
  const byId = {};
  nodes.forEach(n => { byId[n.id] = n; });

  const links = [];
  const seen = new Set();
  const key = (a, b) => a < b ? a + "-" + b : b + "-" + a;
  edges.forEach(e => {
    if (!byId[e.a] || !byId[e.b]) return;
    links.push({ a: e.a, b: e.b, kind: "thread", note: e.note });
    seen.add(key(e.a, e.b));
  });

  // shared-tag affinities — link each paper to its few most-similar peers
  const tagSet = {};
  papers.forEach(p => { tagSet[p.id] = new Set((p.tags || []).map(t => t.toLowerCase())); });
  papers.forEach(p => {
    const mine = tagSet[p.id];
    const cand = [];
    papers.forEach(q => {
      if (q.id === p.id) return;
      let shared = 0;
      tagSet[q.id].forEach(t => { if (mine.has(t)) shared++; });
      if (shared >= 2) cand.push({ id: q.id, shared });
    });
    cand.sort((x, y) => y.shared - x.shared);
    cand.slice(0, 4).forEach(c => {
      const kk = key(p.id, c.id);
      if (seen.has(kk)) return;
      seen.add(kk);
      links.push({ a: p.id, b: c.id, kind: "tag", w: c.shared });
    });
  });

  // guarantee no orphans
  const degCount = {};
  links.forEach(l => { degCount[l.a] = (degCount[l.a] || 0) + 1; degCount[l.b] = (degCount[l.b] || 0) + 1; });
  papers.forEach(p => {
    if (degCount[p.id]) return;
    let best = null, bestShared = -1;
    papers.forEach(q => {
      if (q.id === p.id || q.cluster !== p.cluster) return;
      let shared = 0; tagSet[q.id].forEach(t => { if (tagSet[p.id].has(t)) shared++; });
      if (shared > bestShared) { bestShared = shared; best = q.id; }
    });
    if (best != null) { links.push({ a: p.id, b: best, kind: "tag", w: 1 }); degCount[p.id] = 1; degCount[best] = (degCount[best] || 0) + 1; }
  });

  const adj = {}; nodes.forEach(n => { adj[n.id] = []; });
  links.forEach(l => { adj[l.a].push({ id: l.b, link: l }); adj[l.b].push({ id: l.a, link: l }); });
  nodes.forEach(n => { n.deg = adj[n.id].length; n.r = 4.2 + Math.sqrt(n.deg) * 1.9; });

  return { nodes, links, byId, adj, anchor, R };
}

function GraphView({ papers, clusters, edges, onOpen }) {
  const wrapRef = useRefG(null);
  const canvasRef = useRefG(null);
  const G = useMemoG(() => buildGraph(papers, clusters, edges), [papers, clusters, edges]);

  const [selected, setSelected] = useStateG(null);
  const [hoverId, setHoverId] = useStateG(null);
  const [activeCluster, setActiveCluster] = useStateG(null);
  const [q, setQ] = useStateG("");
  const [legendOpen, setLegendOpen] = useStateG(true);

  const st = useRefG({ selected: null, hoverId: null, activeCluster: null, q: "" });
  useEffectG(() => { st.current = { selected, hoverId, activeCluster, q: q.trim().toLowerCase() }; }, [selected, hoverId, activeCluster, q]);

  useEffectG(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    const nodes = G.nodes, links = G.links, adj = G.adj, R = G.R;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let CW = 0, CH = 0, raf = 0, alpha = 1;
    const FOCAL = 1000;
    const view = { ay: 0.2, ax: 0.34, zoom: 1, cx: 0, cy: 0 };
    let lastInteract = 0, dragging = false, down = false, moved = false, panStart = null;

    function resize() {
      const r = wrap.getBoundingClientRect();
      CW = r.width; CH = r.height;
      canvas.width = Math.round(CW * dpr); canvas.height = Math.round(CH * dpr);
      canvas.style.width = CW + "px"; canvas.style.height = CH + "px";
      view.cx = CW * 0.50; view.cy = CH * 0.56;
      const rs = Math.min(CW * 0.42, CH * 0.48);
      view.zoom = rs / (R * 1.32);
    }
    resize();

    // ---- physics (settles once, then the view rotates) ----
    function step() {
      const kk = alpha;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          let dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
          let d2 = dx * dx + dy * dy + dz * dz; if (d2 < 0.01) { d2 = 0.01; dx = 0.1; }
          const f = 3200 / d2;
          const d = Math.sqrt(d2), ux = dx / d, uy = dy / d, uz = dz / d;
          a.vx += ux * f * kk; a.vy += uy * f * kk; a.vz += uz * f * kk;
          b.vx -= ux * f * kk; b.vy -= uy * f * kk; b.vz -= uz * f * kk;
        }
      }
      links.forEach(l => {
        const a = G.byId[l.a], b = G.byId[l.b];
        const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
        const d = Math.hypot(dx, dy, dz) || 0.01;
        const L = l.kind === "thread" ? 70 : 104;
        const strength = l.kind === "thread" ? 0.09 : 0.04;
        const f = (d - L) / d * strength * kk;
        a.vx += dx * f; a.vy += dy * f; a.vz += dz * f;
        b.vx -= dx * f; b.vy -= dy * f; b.vz -= dz * f;
      });
      nodes.forEach(n => {
        const a = G.anchor[n.cluster];
        if (a) { n.vx += (a.x - n.x) * 0.020 * kk; n.vy += (a.y - n.y) * 0.020 * kk; n.vz += (a.z - n.z) * 0.020 * kk; }
        // pull back onto the spherical shell
        const d = Math.hypot(n.x, n.y, n.z) || 0.01;
        const f = (R - d) * 0.055 * kk;
        n.vx += n.x / d * f; n.vy += n.y / d * f; n.vz += n.z / d * f;
      });
      nodes.forEach(n => {
        n.vx *= 0.80; n.vy *= 0.80; n.vz *= 0.80;
        n.x += n.vx; n.y += n.vy; n.z += n.vz;
      });
      alpha = Math.max(0, alpha * 0.965);
    }
    let warm = 240; while (warm-- > 0) step();

    function isLit(n) {
      const s = st.current;
      const focus = s.hoverId != null ? s.hoverId : s.selected;
      if (focus != null) { if (n.id === focus) return true; return adj[focus].some(e => e.id === n.id); }
      if (s.activeCluster) return n.cluster === s.activeCluster;
      if (s.q) return (n.paper.title + " " + n.paper.author + " " + (n.paper.tags || []).join(" ")).toLowerCase().includes(s.q);
      return true;
    }
    function linkLit(l) {
      const s = st.current;
      const focus = s.hoverId != null ? s.hoverId : s.selected;
      if (focus != null) return l.a === focus || l.b === focus;
      if (s.activeCluster) { const a = G.byId[l.a], b = G.byId[l.b]; return a.cluster === s.activeCluster && b.cluster === s.activeCluster; }
      return true;
    }

    function project(cy, sy, cx, sx) {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        // rotate Y then X
        const x1 = n.x * cy - n.z * sy;
        const z1 = n.x * sy + n.z * cy;
        const y2 = n.y * cx - z1 * sx;
        const z2 = n.y * sx + z1 * cx;
        const persp = FOCAL / (FOCAL - z2);
        n.sx = view.cx + x1 * view.zoom * persp;
        n.sy = view.cy + y2 * view.zoom * persp;
        n.sr = n.r * view.zoom * persp;
        n.sz = z2;
      }
    }

    function draw() {
      const s = st.current;
      const cy = Math.cos(view.ay), sy = Math.sin(view.ay);
      const cx = Math.cos(view.ax), sx = Math.sin(view.ax);
      project(cy, sy, cx, sx);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, CW, CH);

      const focus = s.hoverId != null ? s.hoverId : s.selected;

      // links (depth: draw all, alpha by average depth)
      links.forEach(l => {
        const a = G.byId[l.a], b = G.byId[l.b];
        const lit = linkLit(l);
        const depth = ((a.sz + b.sz) / 2 + R) / (2 * R);      // 0 back … 1 front
        if (l.kind === "thread") {
          ctx.strokeStyle = lit ? `rgba(27,24,19,${0.30 + depth * 0.20})` : "rgba(27,24,19,0.045)";
          ctx.lineWidth = lit ? 1.5 : 1;
        } else {
          ctx.strokeStyle = lit ? `rgba(27,24,19,${0.10 + depth * 0.10})` : "rgba(27,24,19,0.03)";
          ctx.lineWidth = 1;
        }
        ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
      });

      // nodes — sort back→front so near nodes overlap far ones
      const orderIdx = nodes.map((n, i) => i).sort((i, j) => nodes[i].sz - nodes[j].sz);
      orderIdx.forEach(i => {
        const n = nodes[i];
        const lit = isLit(n);
        const depth = (n.sz + R) / (2 * R);                   // 0 back … 1 front
        const [r, g, bl] = hexToRgb(n.color);
        ctx.globalAlpha = lit ? (0.5 + depth * 0.5) : 0.12;
        ctx.beginPath(); ctx.arc(n.sx, n.sy, Math.max(1.4, n.sr), 0, 6.2832);
        ctx.fillStyle = `rgb(${r},${g},${bl})`; ctx.fill();
        ctx.lineWidth = 1.4; ctx.strokeStyle = "rgba(243,239,228,0.85)"; ctx.stroke();
        if (n.id === focus) {
          ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(n.sx, n.sy, n.sr + 4, 0, 6.2832);
          ctx.lineWidth = 1.8; ctx.strokeStyle = `rgb(${r},${g},${bl})`; ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;

      // labels — only for the focused node + neighbours (keeps it clean)
      if (focus != null) {
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        const show = [focus].concat(adj[focus].map(e => e.id));
        show.forEach(id => {
          const n = G.byId[id];
          const fs = id === focus ? 13.5 : 11;
          ctx.font = `${id === focus ? 600 : 500} ${fs}px Spectral, Georgia, serif`;
          const label = gShortTitle(n.paper.title);
          ctx.lineWidth = 3.2; ctx.strokeStyle = "rgba(243,239,228,0.92)";
          ctx.strokeText(label, n.sx, n.sy + n.sr + 4);
          ctx.fillStyle = INK; ctx.fillText(label, n.sx, n.sy + n.sr + 4);
        });
      }
    }

    function loop() {
      const now = performance.now();
      if (alpha > 0.003) step();
      if (!dragging && now - lastInteract > 1100) view.ay += 0.0019;   // idle auto-spin
      draw();
      raf = requestAnimationFrame(loop);
    }
    loop();

    // ---- interaction ----
    function pos(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function pick(px, py) {
      let hit = null, bestZ = -1e9;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const dx = n.sx - px, dy = n.sy - py;
        if (dx * dx + dy * dy < (n.sr + 6) * (n.sr + 6) && n.sz > bestZ) { bestZ = n.sz; hit = n; }
      }
      return hit;
    }
    function onDown(e) { const p = pos(e); down = true; dragging = false; moved = false; panStart = p; lastInteract = performance.now(); }
    function onMove(e) {
      const p = pos(e);
      if (down) {
        const dx = p.x - panStart.x, dy = p.y - panStart.y;
        if (!dragging && Math.abs(dx) + Math.abs(dy) > 3) dragging = true;
        if (dragging) {
          view.ay += dx * 0.006;
          view.ax = Math.max(-1.35, Math.min(1.35, view.ax + dy * 0.006));
          panStart = p; moved = true; lastInteract = performance.now();
        }
        return;
      }
      const n = pick(p.x, p.y);
      const id = n ? n.id : null;
      if (id !== st.current.hoverId) { setHoverId(id); canvas.style.cursor = id ? "pointer" : "grab"; }
    }
    function onUp(e) {
      if (down && !moved) { const p = pos(e); const n = pick(p.x, p.y); setSelected(n ? n.id : null); }
      down = false; dragging = false; lastInteract = performance.now();
    }
    function onWheel(e) {
      e.preventDefault();
      view.zoom = Math.max(0.4, Math.min(3.4, view.zoom * (e.deltaY < 0 ? 1.1 : 0.909)));
      lastInteract = performance.now();
    }
    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    const ro = new ResizeObserver(() => resize());
    ro.observe(wrap);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("wheel", onWheel);
      ro.disconnect();
    };
  }, [G]);

  const sel = selected != null ? G.byId[selected] : null;
  const selThreads = sel ? G.adj[sel.id].filter(e => e.link.kind === "thread").map(e => ({ paper: G.byId[e.id].paper, note: e.link.note })) : [];
  const order = Object.keys(clusters);

  return (
    <div className="graph" ref={wrapRef}>
      <canvas className="graph-canvas" ref={canvasRef}></canvas>

      <div className="graph-head">
        <span className="eyebrow">Connections</span>
        <h1 className="graph-title">An atlas of connected ideas</h1>
        <p className="graph-sub">Each cluster is a region of the globe. Drag to spin · scroll to zoom · hover to trace an idea's connections.</p>
      </div>

      <div className="graph-controls">
        <input className="graph-search" placeholder="Highlight by idea or author…" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <div className={"graph-legend" + (legendOpen ? "" : " closed")}>
        <button className="graph-legend-toggle" onClick={() => setLegendOpen(o => !o)}>
          <span className="graph-legend-head">Clusters</span>
          <span className="graph-legend-caret">{legendOpen ? "–" : "+"}</span>
        </button>
        {legendOpen && (
          <div className="graph-legend-list">
            {order.map(name => {
              const c = clusters[name];
              const on = activeCluster === name;
              return (
                <button key={name} className={"graph-legend-item" + (on ? " on" : "")}
                  onClick={() => setActiveCluster(on ? null : name)}>
                  <i className="graph-legend-dot" style={{ background: c.color }} />
                  <span>{c.short}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {sel && (
        <aside className="graph-panel" style={{ "--c": sel.color }}>
          <button className="graph-panel-x" onClick={() => setSelected(null)}>✕</button>
          <span className="graph-panel-kicker"><i style={{ background: sel.color }} />{clusters[sel.cluster].short} · № {String(sel.id).padStart(3, "0")}</span>
          <h2 className="graph-panel-title">{sel.paper.title}</h2>
          <div className="graph-panel-meta">{sel.paper.author} · {sel.paper.year}</div>
          <p className="graph-panel-summary">{sel.paper.summary.split(". ").slice(0, 2).join(". ")}.</p>
          {selThreads.length > 0 && (
            <div className="graph-panel-threads">
              <span className="graph-panel-h">Idea-threads</span>
              {selThreads.map(t => (
                <button key={t.paper.id} className="graph-panel-thread" onClick={() => setSelected(t.paper.id)}>
                  <span className="graph-panel-thread-note">{t.note}</span>
                  <span className="graph-panel-thread-paper">→ {t.paper.title}</span>
                </button>
              ))}
            </div>
          )}
          <button className="graph-panel-open" onClick={() => onOpen(sel.id)}>Open the reading page →</button>
        </aside>
      )}
    </div>
  );
}

window.GraphView = GraphView;
