/* global React */
const { useState: useStateC, useMemo: useMemoC, useRef: useRefC, useEffect: useEffectC } = React;

function yrOf(y) { if (typeof y === "number") return y; const m = ("" + y).match(/\d{4}/); return m ? +m[0] : 1950; }

const DIFF_LABEL_C = ["", "Accessible", "Approachable", "Demanding", "Advanced", "Formidable"];

function CardPips({ n, color }) {
  return (
    <span className="pips" style={{ color }}>
      {[0,1,2,3,4].map(i => <i key={i} className={"pip" + (i < n ? " on" : "")} />)}
    </span>
  );
}

/* ---- Shared paper card (cluster grid + search results) ---- */
function PaperCard({ paper, clusters, onOpen, showCluster }) {
  const c = clusters[paper.cluster];
  const snippet = paper.summary.split(". ").slice(0, 2).join(". ") + ".";
  return (
    <button className="pcard" style={{ "--c": c.color }} onClick={() => onOpen(paper.id)}>
      <div className="pcard-top">
        <span className="pcard-kicker" style={{ color: c.color }}>
          <i className="pcard-dot" style={{ background: c.color }} />
          {showCluster ? c.short : "№ " + String(paper.id).padStart(3, "0")}
        </span>
        <span className="pcard-year">{paper.year}</span>
      </div>
      <h3 className="pcard-title">{paper.title}</h3>
      <div className="pcard-author">{paper.author}</div>
      <p className="pcard-snip">{snippet}</p>
      <div className="pcard-foot">
        <span className="pcard-diff"><CardPips n={paper.difficulty} color={c.color} /> {DIFF_LABEL_C[paper.difficulty]}</span>
        <span className="pcard-rt">{paper.reading_time}</span>
      </div>
    </button>
  );
}
window.PaperCard = PaperCard;

/* ---- Cluster page ---- */
function ClusterView({ cluster, papers, clusters, onOpen, onBack }) {
  const [sort, setSort] = useStateC("year");
  const c = clusters[cluster];
  const list = useMemoC(() => {
    const arr = papers.filter(p => p.cluster === cluster);
    const by = {
      year: (a, b) => a.year === b.year ? a.id - b.id : ("" + a.year).localeCompare("" + b.year),
      difficulty: (a, b) => a.difficulty - b.difficulty || a.id - b.id,
      reading: (a, b) => rt(a.reading_time) - rt(b.reading_time)
    };
    return [...arr].sort(by[sort]);
  }, [papers, cluster, sort]);

  const idx = Object.keys(clusters).indexOf(cluster) + 1;

  return (
    <div className="cluster" style={{ "--c": c.color }}>
      <div className="cluster-scroll">
        <header className="cluster-head">
          <button className="read-back" onClick={onBack}><span className="read-back-mark">←</span> The Atlas</button>
          <div className="cluster-hero">
            <span className="cluster-kicker" style={{ color: c.color }}>
              <i className="cluster-dot" style={{ background: c.color }} />
              Cluster {String(idx).padStart(2, "0")} · {c.n} papers
            </span>
            <h1 className="cluster-title">{cluster}</h1>
            <p className="cluster-desc">{c.desc}</p>
          </div>
          <div className="cluster-tools">
            <span className="cluster-tools-label">Sort</span>
            <div className="seg">
              {[["year", "Year"], ["difficulty", "Difficulty"], ["reading", "Reading time"]].map(([k, l]) => (
                <button key={k} className={"seg-btn" + (sort === k ? " on" : "")} onClick={() => setSort(k)}>{l}</button>
              ))}
            </div>
          </div>
        </header>

        <div className="pgrid">
          {list.map(p => <PaperCard key={p.id} paper={p} clusters={clusters} onOpen={onOpen} />)}
        </div>
        <div className="cluster-foot">The Canon · 115 Greatest Papers in Economics &amp; Political Philosophy</div>
      </div>
    </div>
  );
}
function rt(s) { // crude minutes from "30 min" / "3–4 hours"
  if (/hour/.test(s)) { const m = s.match(/[\d.]+/); return (parseFloat(m ? m[0] : "2")) * 60; }
  const m = s.match(/\d+/); return m ? parseInt(m[0]) : 0;
}
window.ClusterView = ClusterView;

/* ---- Editorial Index (home browse: all clusters as sections of rows) ---- */
function IndexView({ papers, clusters, onOpen, initialCluster }) {
  const order = Object.keys(clusters);
  const roman = ["I","II","III","IV","V","VI","VII","VIII","IX"];
  const scrollRef = useRefC(null);
  const sections = useMemoC(() => order.map(name => ({
    name, c: clusters[name],
    list: papers.filter(p => p.cluster === name).sort((a, b) => a.id - b.id)
  })), [papers, clusters]);

  const scrollTo = (i) => {
    const sc = scrollRef.current; if (!sc) return;
    const el = sc.querySelector("#cl-" + i); if (!el) return;
    sc.scrollTo({ top: sc.scrollTop + el.getBoundingClientRect().top - sc.getBoundingClientRect().top - 14, behavior: "smooth" });
  };
  useEffectC(() => {
    if (!initialCluster) return;
    const i = order.indexOf(initialCluster);
    if (i < 0) return;
    // The index is long and mounts during a view transition, so layout/heights
    // settle over a few frames. Re-jump (instantly) several times until the
    // target offset stabilises, instead of a single early rAF that lands at 0.
    let tries = 0, timer = null;
    const attempt = () => {
      const sc = scrollRef.current;
      const el = sc && sc.querySelector("#cl-" + i);
      if (sc && el) {
        const target = Math.max(0, sc.scrollTop + el.getBoundingClientRect().top - sc.getBoundingClientRect().top - 14);
        if (Math.abs(target - sc.scrollTop) > 2) sc.scrollTo({ top: target, behavior: "auto" });
      }
      if (++tries < 7) timer = setTimeout(attempt, 70);
    };
    timer = setTimeout(attempt, 0);
    return () => { if (timer) clearTimeout(timer); };
  }, []);

  return (
    <div className="index">
      <div className="index-scroll" ref={scrollRef}>
        <div className="index-inner">
          <aside className="index-rail">
            <span className="index-rail-head">The Index</span>
            <nav className="index-rail-nav">
              {order.map((name, i) => {
                const c = clusters[name];
                return (
                  <button key={name} className="rail-item" style={{ "--c": c.color }} onClick={() => scrollTo(i)}>
                    <i className="rail-dot" style={{ background: c.color }} />
                    <span className="rail-name">{c.short}</span>
                    <span className="rail-n">{c.n}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
          <main className="index-main">
            {sections.map((s, i) => (
              <section className="index-section" id={"cl-" + i} key={s.name} style={{ "--c": s.c.color }}>
                <header className="index-sec-head">
                  <span className="index-sec-rom" style={{ color: s.c.color }}>{roman[i]}</span>
                  <div className="index-sec-titles">
                    <h2 className="index-sec-name">{s.name}<span className="index-sec-n">{s.c.n} papers</span></h2>
                    <p className="index-sec-desc">{s.c.desc}</p>
                  </div>
                </header>
                <div className="index-rows">
                  {s.list.map(p => (
                    <button key={p.id} className="irow" style={{ "--c": s.c.color }} onClick={() => onOpen(p.id)}>
                      <span className="irow-id">{String(p.id).padStart(3, "0")}</span>
                      <span className="irow-main">
                        <span className="irow-title">{p.title}</span>
                        <span className="irow-author">{p.author}</span>
                      </span>
                      <span className="irow-pips"><CardPips n={p.difficulty} color={s.c.color} /></span>
                      <span className="irow-rt">{p.reading_time}</span>
                      <span className="irow-year">{yrOf(p.year)}</span>
                      <span className="irow-arr">→</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
            <div className="cluster-foot">The Canon · 115 Greatest Papers in Economics &amp; Political Philosophy</div>
          </main>
        </div>
      </div>
    </div>
  );
}
window.IndexView = IndexView;

/* ---- Search results ---- */
function SearchResults({ query, papers, clusters, onOpen }) {
  const q = query.trim().toLowerCase();
  const hits = papers.filter(p =>
    [p.title, p.author, p.cluster, p.summary, ...(p.tags || []), ...(p.key_ideas || [])]
      .join(" ").toLowerCase().includes(q));
  return (
    <div className="search">
      <div className="search-scroll">
        <div className="search-head">
          <span className="eyebrow">{hits.length} {hits.length === 1 ? "paper" : "papers"} found</span>
          <h1 className="search-title">“{query}”</h1>
        </div>
        {hits.length === 0
          ? <p className="search-empty">No papers match that search. Try an author, a concept, or a school of thought.</p>
          : <div className="pgrid">
              {hits.map(p => <PaperCard key={p.id} paper={p} clusters={clusters} onOpen={onOpen} showCluster />)}
            </div>}
        <div className="cluster-foot">The Canon · search across all 115 papers</div>
      </div>
    </div>
  );
}
window.SearchResults = SearchResults;
