/* global React, ReactDOM, IntroPage, IndexView, SearchResults, ReadingPage, GraphView, LandingPage, CANON_PAPERS, CANON_CLUSTERS, CANON_EDGES */
const { useState, useEffect, useMemo, useCallback } = React;

function App() {
  const papers = CANON_PAPERS, clusters = CANON_CLUSTERS, edges = CANON_EDGES;
  const byId = useMemo(() => Object.fromEntries(papers.map(p => [p.id, p])), [papers]);

  const [view, setView] = useState("landing");    // landing | intro | index | graph | reading
  const [paperId, setPaperId] = useState(null);
  const [origin, setOrigin] = useState({ type: "view", view: "index" });
  const [query, setQuery] = useState("");
  const [indexAnchor, setIndexAnchor] = useState(null);

  const q = query.trim();
  const screen = view === "reading" ? "reading" : (q ? "search" : view);

  const enterIndex = useCallback(() => { setIndexAnchor(null); setView("index"); setQuery(""); }, []);
  const enterIndexAt = useCallback((name) => { setIndexAnchor(name); setView("index"); setQuery(""); }, []);
  const enterGraph = useCallback(() => { setView("graph"); setQuery(""); }, []);
  const toIntro = useCallback(() => { setView("intro"); setQuery(""); }, []);
  const focusSearch = useCallback(() => {
    setView("index");
    requestAnimationFrame(() => { const el = document.querySelector(".head-search-input"); if (el) el.focus(); });
  }, []);

  const openPaper = useCallback((id) => {
    setOrigin(q ? { type: "search", query } : { type: "view", view: view === "reading" ? "index" : view });
    setQuery("");
    setPaperId(id); setView("reading");
    requestAnimationFrame(() => { const el = document.querySelector(".read-scroll"); if (el) el.scrollTop = 0; });
  }, [q, query, view]);

  const back = useCallback(() => {
    if (origin.type === "search") { setQuery(origin.query || ""); setView("index"); }
    else setView(origin.view || "index");
  }, [origin]);

  useEffect(() => {
    const on = (e) => {
      if (e.key !== "Escape") return;
      if (view === "reading") back();
      else if (q) setQuery("");
      else if (view === "index" || view === "graph") toIntro();
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [view, q, back, toIntro]);

  // reading-page context (prev/next & relations within the paper's cluster)
  const cur = paperId != null ? byId[paperId] : null;
  const curCluster = cur ? cur.cluster : null;
  const clusterList = useMemo(() => cur ? papers.filter(p => p.cluster === curCluster).sort((a, b) => a.id - b.id) : [], [cur, curCluster, papers]);
  const curIdx = cur ? clusterList.findIndex(p => p.id === cur.id) : -1;
  const goRel = (d) => { const ni = (curIdx + d + clusterList.length) % clusterList.length; openPaper(clusterList[ni].id); };

  const related = cur ? edges
    .filter(e => e.a === cur.id || e.b === cur.id)
    .map(e => ({ paper: byId[e.a === cur.id ? e.b : e.a], note: e.note }))
    .filter(r => r.paper) : [];
  const relIds = new Set(related.map(r => r.paper.id));
  const clusterMates = cur ? clusterList.filter(p => p.id !== cur.id && !relIds.has(p.id)).slice(0, 4) : [];

  const backLabel = origin.type === "search" ? "Search" : (origin.view === "graph" ? "Connections" : "The Index");

  if (view === "landing") {
    return (
      <div className="app grain">
        <LandingPage clusters={clusters} onEnter={() => setView("intro")} />
      </div>
    );
  }

  return (
    <div className="app grain">
      <header className="head">
        <div className="head-brand" onClick={enterIndex}>
          <span className="head-mark">The Canon</span>
          <span className="head-sub">115 Greatest Papers in Economics &amp; Political Philosophy</span>
        </div>
        <div className="head-search">
          <span className="head-search-ico">⌕</span>
          <input className="head-search-input" placeholder="Search by title, author, or idea…"
            value={query} onChange={e => { const v = e.target.value; setQuery(v); if (view === "reading" && v.trim()) setView("index"); }} />
          {query && <button className="head-search-clear" onClick={() => setQuery("")}>clear</button>}
        </div>
        <nav className="head-nav">
          <button className={"head-link" + (view === "intro" ? " on" : "")} onClick={toIntro}>About</button>
          <button className={"head-link" + (screen === "index" ? " on" : "")} onClick={enterIndex}>Index</button>
          <button className={"head-link" + (screen === "graph" ? " on" : "")} onClick={enterGraph}>Connections</button>
        </nav>
      </header>

      <main className="body">
        <div className={"stage" + (view === "reading" ? " behind" : "")}>
          {screen === "search" ? (
            <SearchResults query={query} papers={papers} clusters={clusters} onOpen={openPaper} />
          ) : screen === "intro" ? (
            <IntroPage clusters={clusters} onEnter={enterIndex} onEnterAt={enterIndexAt} onSearch={focusSearch} />
          ) : screen === "graph" ? (
            <GraphView papers={papers} clusters={clusters} edges={edges} onOpen={openPaper} />
          ) : (
            <IndexView papers={papers} clusters={clusters} onOpen={openPaper} initialCluster={indexAnchor} />
          )}
        </div>

        {cur && (
          <div className={"reader" + (view === "reading" ? " in" : "")}>
            <ReadingPage
              paper={cur} clusters={clusters} related={related} clusterMates={clusterMates}
              onOpen={openPaper} onBack={back} onPrev={() => goRel(-1)} onNext={() => goRel(1)}
              backLabel={backLabel}
              indexLabel={`${String(curIdx + 1).padStart(2, "0")} / ${String(clusterList.length).padStart(2, "0")} · ${clusters[curCluster].short}`}
            />
          </div>
        )}
      </main>
    </div>
  );
}

function mountCanon() {
  ReactDOM.createRoot(document.getElementById("root")).render(<App />);
}
(function startCanon() {
  let started = false;
  const go = () => { if (!started) { started = true; mountCanon(); } };
  if (document.fonts && document.fonts.load) {
    Promise.all([
      document.fonts.load("400 1em Spectral"),
      document.fonts.load("500 1em Spectral"),
      document.fonts.load("600 1em Spectral"),
      document.fonts.load("400 1em 'IBM Plex Mono'"),
      document.fonts.load("500 1em 'IBM Plex Mono'")
    ]).then(go, go);
    setTimeout(go, 1500);
  } else { go(); }
})();
