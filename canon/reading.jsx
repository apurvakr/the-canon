/* global React */
const DIFF_LABEL = ["", "Accessible", "Approachable", "Demanding", "Advanced", "Formidable"];
const ACCESS_LABEL = {
  open: "Open access",
  publisher: "Publisher site",
  jstor: "JSTOR · stable link",
  scholar: "Via Google Scholar"
};

function Pips({ n, color }) {
  return (
    <span className="pips" style={{ color }}>
      {[0,1,2,3,4].map(i => <i key={i} className={"pip" + (i < n ? " on" : "")} />)}
    </span>
  );
}

/* ---- author portrait helpers ---- */
function firstAuthor(a) { return a.split("&")[0].split(",")[0].trim(); }
function authorSlug(a) { return firstAuthor(a).toLowerCase().replace(/[^a-z]+/g, "-").replace(/(^-|-$)/g, ""); }
function authorInitials(a) {
  const parts = firstAuthor(a).split(/\s+/).filter(Boolean);
  const f = parts[0] ? parts[0][0] : "";
  const l = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (f + l).toUpperCase();
}
function monogramURI(a, color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260"><rect width="260" height="260" fill="#ECE7D8"/><circle cx="130" cy="130" r="129" fill="none" stroke="${color}" stroke-opacity="0.35"/><text x="130" y="130" dy=".35em" text-anchor="middle" font-family="Spectral, Georgia, serif" font-size="108" font-weight="600" fill="${color}">${authorInitials(a)}</text></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

/* Public-domain author portraits (Wikimedia Commons, via stable FilePath URLs),
   keyed by author slug. Everyone else falls back to the monogram. */
const FP = "https://commons.wikimedia.org/wiki/Special:FilePath/";
const PORTRAITS = {
  "thomas-hobbes": FP + "Thomas%20Hobbes%20%28portrait%29.jpg?width=400",
  "john-locke": FP + "John%20Locke.jpg?width=400",
  "david-ricardo": FP + "Portrait%20of%20David%20Ricardo%20by%20Thomas%20Phillips.jpg?width=400",
  "john-stuart-mill": FP + "JohnStuartMill.jpg?width=400",
  "adam-smith": FP + "Adam%20Smith%20The%20Muir%20portrait.jpg?width=400",
  "john-maynard-keynes": FP + "Keynes%201933.jpg?width=400",
  "immanuel-kant": FP + "Immanuel%20Kant%20(painted%20portrait).jpg?width=400",
  "jean-jacques-rousseau": FP + "Jean-Jacques%20Rousseau%20(painted%20portrait).jpg?width=400",
  "alexis-de-tocqueville": FP + "Alexis%20de%20Tocqueville%20(Th%C3%A9odore%20Chass%C3%A9riau%20-%20Versailles).jpg?width=400",
  "mary-wollstonecraft": FP + "Mary%20Wollstonecraft%20by%20John%20Opie%20(c.%201797).jpg?width=400",
  "max-weber": FP + "Max%20Weber%201894.jpg?width=400"
};

// Split a byline into individual authors: "A, B & C" -> [A, B, C]
function splitAuthors(a) { return a.split(/[,&]/).map(s => s.trim()).filter(Boolean); }
function portraitForName(n, color) { return PORTRAITS[authorSlug(n)] || monogramURI(n, color); }

/* =========================================================================
   Reading page — the full record of a single paper
   ========================================================================= */
function ReadingPage({ paper, clusters, related, clusterMates, onOpen, onBack, onPrev, onNext, indexLabel, backLabel }) {
  const c = clusters[paper.cluster];
  const authors = splitAuthors(paper.author);
  const pSize = authors.length === 1 ? 104 : authors.length === 2 ? 90 : authors.length <= 4 ? 74 : 62;
  const anyPD = authors.some(n => PORTRAITS[authorSlug(n)]);
  return (
    <div className="read" style={{ "--c": c.color }} key={paper.id}>
      <div className="read-bar">
        <button className="read-back" onClick={onBack}>
          <span className="read-back-mark">←</span> {backLabel || "The Canon"}
        </button>
        <div className="read-nav">
          <button className="read-step" onClick={onPrev} title="Previous paper">←</button>
          <span className="read-step-label">{indexLabel}</span>
          <button className="read-step" onClick={onNext} title="Next paper">→</button>
        </div>
      </div>

      <div className="read-scroll">
        <article className="read-col">
          {/* spine */}
          <div className="read-spine">
            <span className="read-cluster" style={{ color: c.color }}>
              <i className="read-cluster-dot" style={{ background: c.color }} />
              {paper.cluster}
            </span>
            <span className="read-id">№ {String(paper.id).padStart(3, "0")}</span>
          </div>

          <h1 className="read-title">{paper.title}</h1>

          <div className={"read-byline" + (authors.length > 1 ? " multi" : "")}>
            <div className="read-portraits">
              {authors.map((n, i) => (
                <figure className="afig" key={i}>
                  <image-slot
                    id={"author-" + authorSlug(n)}
                    class="read-portrait"
                    shape="circle"
                    fit="cover"
                    src={portraitForName(n, c.color)}
                    placeholder=""
                    style={{ width: pSize + "px", height: pSize + "px" }}
                  ></image-slot>
                  <figcaption className="afig-cap">{n}</figcaption>
                </figure>
              ))}
            </div>
            <div className="read-byline-foot">
              <span className="read-pub">{paper.publication}, {paper.year}</span>
              <span className="read-portrait-hint">{anyPD ? "Portrait: public domain · Wikimedia Commons" : (authors.length > 1 ? "Drag a photo onto any circle to add a portrait" : "Drag a photo onto the circle to add a portrait")}</span>
            </div>
          </div>

          {/* meta strip */}
          <div className="read-meta">
            <div className="read-meta-cell">
              <span className="eyebrow">Difficulty</span>
              <span className="read-meta-val"><Pips n={paper.difficulty} color={c.color} /> {DIFF_LABEL[paper.difficulty]}</span>
            </div>
            <div className="read-meta-cell">
              <span className="eyebrow">Reading time</span>
              <span className="read-meta-val">{paper.reading_time}</span>
            </div>
            <div className="read-meta-cell">
              <span className="eyebrow">Year</span>
              <span className="read-meta-val">{paper.year}</span>
            </div>
          </div>

          {/* lead */}
          <p className="read-lead">{paper.summary}</p>

          {/* key ideas */}
          <section className="read-section">
            <h2 className="read-h2">Key ideas</h2>
            <ol className="read-ideas">
              {paper.key_ideas.map((k, i) => (
                <li key={i} className="read-idea">
                  <span className="read-idea-num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="read-idea-text">{k}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* why canonical */}
          <section className="read-canon">
            <span className="read-canon-mark" style={{ color: c.color }}>Why it is canonical</span>
            <p className="read-canon-text">{paper.canonical}</p>
          </section>

          {/* tags */}
          <div className="read-tags">
            {paper.tags.map(t => <span key={t} className="read-tag">{t}</span>)}
          </div>

          {/* link out */}
          <a className="read-cta" href={paper.link.url} target="_blank" rel="noopener noreferrer">
            <span className="read-cta-main">
              <span className="read-cta-label">Read the paper</span>
              <span className="read-cta-src">{paper.link.label}</span>
            </span>
            <span className="read-cta-right">
              <span className={"read-cta-badge access-" + paper.link.access}>{ACCESS_LABEL[paper.link.access]}</span>
              <span className="read-cta-arrow">↗</span>
            </span>
          </a>

          {/* related */}
          {related.length > 0 && (
            <section className="read-related">
              <h2 className="read-h2">Threads from this paper</h2>
              <div className="read-related-list">
                {related.map(r => {
                  const rc = clusters[r.paper.cluster];
                  return (
                    <button key={r.paper.id} className="rel" onClick={() => onOpen(r.paper.id)} style={{ "--c": rc.color }}>
                      <span className="rel-note">{r.note}</span>
                      <span className="rel-paper">
                        <i className="rel-dot" style={{ background: rc.color }} />
                        <span className="rel-title">{r.paper.title}</span>
                      </span>
                      <span className="rel-author">{r.paper.author.split("&")[0].split(",")[0].trim()} · {r.paper.year}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* more from cluster */}
          {clusterMates && clusterMates.length > 0 && (
            <section className="read-related read-more">
              <h2 className="read-h2">More from {c.short}</h2>
              <div className="read-more-list">
                {clusterMates.map(m => (
                  <button key={m.id} className="morelink" onClick={() => onOpen(m.id)}>
                    <span className="morelink-title">{m.title}</span>
                    <span className="morelink-meta">{m.author.split("&")[0].split(",")[0].trim()} · {m.year}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className="read-foot">The Canon · 115 Greatest Papers in Economics &amp; Political Philosophy</div>
        </article>
      </div>
    </div>
  );
}

window.ReadingPage = ReadingPage;
