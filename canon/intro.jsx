/* global React */

/* =========================================================================
   What is The Canon — the opening / About page
   ========================================================================= */
function IntroPage({ clusters, onEnter, onEnterAt, onSearch }) {
  const names = Object.keys(clusters);
  const blurb = {
    "Markets & The Price System": "how prices work and why markets exist",
    "Welfare, Inequality & Distribution": "how we measure and judge social outcomes",
    "Growth, Accumulation & Development": "why economies grow — and why so many don't",
    "Institutions, Property Rights & Power": "the rules that structure economic and political life",
    "Political Economy & Public Choice": "what happens when economists study politics",
    "Information, Uncertainty & Behavior": "incomplete information and human psychology",
    "Trade, Capital & The Global Order": "the politics of a connected world economy",
    "Liberty, Justice & The Good Society": "the core questions of political philosophy",
    "Democracy, Legitimacy & The State": "where authority comes from — and when it fails"
  };

  let secNo = 0;
  const Sec = ({ title, children }) => {
    secNo += 1;
    return (
      <section className="essay-section">
        <div className="essay-h2-wrap">
          <span className="essay-h2-n">{String(secNo).padStart(2, "0")}</span>
          <h2 className="essay-h2">{title}</h2>
        </div>
        {children}
      </section>
    );
  };

  return (
    <div className="intro">
      <div className="intro-scroll">
        <article className="essay">
          <header className="essay-masthead">
            <span className="essay-eyebrow">About</span>
            <h1 className="essay-title">What is The Canon</h1>
            <p className="essay-dek">
              The Canon is a guide to the 115 papers that most shaped how we understand economics and political philosophy —
              each one summarised, rated for difficulty, and linked to the source. It isn't a citation ranking. It's a
              judgement about which ideas actually changed how the world thinks.
            </p>
            <div className="essay-actions">
              <button className="intro-btn primary" onClick={onEnter}>Enter the Index <span className="intro-arr">→</span></button>
              <button className="intro-btn" onClick={onSearch}>Search the canon ⌕</button>
            </div>
          </header>

          <Sec title="The problem with most lists">
            <p className="essay-p">Most "greatest papers" lists are citation counts in disguise. But citations only measure influence inside a field. They don't measure which ideas changed how the world thinks — and that is the only thing this list cares about.</p>
          </Sec>

          <Sec title="What we selected for">
            <p className="essay-p">Three questions decided every paper.</p>
            <div className="essay-q">
              <span className="essay-q-n">1</span>
              <div className="essay-q-body">
                <p className="essay-q-title">Does it change the frame?</p>
                <p className="essay-p">Not papers that extend an idea — papers that <em>created</em> the idea everyone else then spent decades extending. Solow's growth model. Rawls's veil of ignorance. Akerlof's lemons. These aren't moves in a debate; they are the debate.</p>
              </div>
            </div>
            <div className="essay-q">
              <span className="essay-q-n">2</span>
              <div className="essay-q-body">
                <p className="essay-q-title">Would a serious person be lost without it?</p>
                <p className="essay-p">Would an analyst, economist, philosopher, or thoughtful reader have a real blind spot if they'd never met it? That test cut the work that matters only to specialists.</p>
              </div>
            </div>
            <div className="essay-q">
              <span className="essay-q-n">3</span>
              <div className="essay-q-body">
                <p className="essay-q-title">Has it survived the evidence?</p>
                <p className="essay-p">Influence isn't enough. Reinhart and Rogoff's austerity paper was hugely influential — then undone by a spreadsheet error. It's not here. A paper has to still hold up once the profession has picked it apart.</p>
              </div>
            </div>
          </Sec>

          <Sec title="Papers first — and the books that had to be here">
            <p className="essay-p">The Canon is built from papers: the sharpest version of an idea usually came first, in one. Rawls's 1958 essay holds the argument his 1971 book took 500 pages to build, so the essay is what we list.</p>
            <p className="essay-p">But some ideas only ever lived at book length, and a canon that shut them out would be dishonest. Where that's true we include the work and point you to the chapters that carry the argument — Smith's <em>Wealth of Nations</em>, Keynes's <em>General Theory</em>, Kant's <em>Groundwork</em>, Rousseau's <em>Social Contract</em>, Tocqueville's <em>Democracy in America</em> — rather than fake a paper that was never written.</p>
          </Sec>

          <Sec title="How it's organised">
            <p className="essay-p">Nine themes, not disciplines or dates. Splitting economics from political philosophy would hide how tangled they are — you can't read Rawls without Arrow. And ordering by date would fake a story of progress. These ideas argue with each other: Nozick refutes Rawls; Stigler attacks the welfare economists. The tension is the point.</p>
            <p className="essay-clusters-intro">The nine clusters — pick one to enter the Index:</p>
            <div className="essay-clusters">
              {names.map(name => {
                const c = clusters[name];
                return (
                  <button key={name} className="ecl" style={{ "--c": c.color }} onClick={() => onEnterAt(name)}>
                    <i className="ecl-dot" style={{ background: c.color }} />
                    <span className="ecl-name">{name}</span>
                    <span className="ecl-em">—</span>
                    <span className="ecl-desc">{blurb[name]}</span>
                  </button>
                );
              })}
            </div>
          </Sec>

          <Sec title="Voices beyond the West">
            <p className="essay-p">The standard canon is overwhelmingly Anglo-American. The Canon reaches wider — not as a gesture, but because the arguments earn it.</p>
            <p className="essay-p">Prebisch (1950) is the strongest challenge to comparative advantage ever made, and 75 years of testing haven't broken it. Ambedkar's <em>Annihilation of Caste</em> names a kind of inequality that Rawls and Nozick had no tools to see. Fanon, Spivak, Chang, Lin, Basu, Sen, and Bardhan are here because the ideas hold — not to fill a quota.</p>
          </Sec>

          <Sec title="Why recent papers are in">
            <p className="essay-p">"Canon" usually means old and settled. We included twelve papers from 2014–2024 anyway, for two reasons.</p>
            <p className="essay-p">Some already moved the world fast. Chetty's "Fading American Dream" (2017) reshaped the US inequality debate within two years. Foa and Mounk (2016) called the democratic ruptures that followed. Zucman (2018) helped drive the global minimum tax.</p>
            <p className="essay-p">And stopping at 2010 would pretend nothing since has mattered. It has. Recent papers carry a badge, so you can tell a 50-year track record from a 5-year one.</p>
          </Sec>

          <Sec title="How to use it">
            <p className="essay-p"><strong>New to the field?</strong> Start with difficulty 1–2 papers in a theme you already care about. The "Accessible" ones — Hayek on prices, Sen on missing women, Fanon, Olson — are written for smart general readers.</p>
            <p className="essay-p"><strong>Building a reading list?</strong> Work through a cluster. The papers argue with each other on purpose — read Hayek with Polanyi, Rawls with Nozick.</p>
            <p className="essay-p"><strong>Writing or arguing a point?</strong> Search by idea or author. Each paper's "Why it's canonical" tells you what it changed, not just what it says.</p>
            <p className="essay-p"><strong>A researcher?</strong> Mind the difficulty rating — it measures formalism, not importance. The hardest papers (Arrow-Debreu, Kant, Dworkin) often carry the biggest ideas.</p>
            <p className="essay-p"><strong>Save as you go.</strong> Star a paper to add it to your reading list; it stays there across visits.</p>
          </Sec>

          <Sec title="A note on objectivity">
            <p className="essay-p">This list isn't objective. No list is. It's a set of judgements — about what matters, which tensions to surface, and whose voices to include.</p>
            <p className="essay-pull">What it is, we hope, is <em>defensible</em>: every paper earns its place, and every exclusion has a reason.</p>
            <p className="essay-p">Disagree? Think something here doesn't belong, or something is missing? That argument is exactly what The Canon is for.</p>
          </Sec>

          <footer className="essay-sign">
            <span className="essay-sign-rule" />
            <button className="intro-btn primary big" onClick={onEnter}>Enter the Index <span className="intro-arr">→</span></button>
          </footer>
        </article>
      </div>
    </div>
  );
}

window.IntroPage = IntroPage;
