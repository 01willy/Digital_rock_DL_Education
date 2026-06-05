/* =====================================================================
   App root + hash router
   ===================================================================== */
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#EA851B",
  "surface": "웜 페이퍼",
  "radius": "둥글게"
}/*EDITMODE-END*/;

const ACCENTS = {
  '#EA851B': ['#EA851B', '#D4760F', '#F6C994'],   // signature orange
  '#E0A21B': ['#E0A21B', '#C58A0F', '#F3D58A'],   // golden amber
  '#D2691E': ['#D2691E', '#B4530F', '#EEB58A'],   // terracotta clay
};
const SURFACES = {
  '웜 페이퍼':  { bg: '#F7F5F1', p2: '#FBFAF7', tint: '#FDF2E4' },
  '쿨 그레이':  { bg: '#F1F3F6', p2: '#F8FAFB', tint: '#FBF1E4' },
  '퓨어 화이트': { bg: '#F4F5F7', p2: '#FCFCFD', tint: '#FDF2E4' },
};
const RADII = {
  '둥글게': { r: '10px', lg: '16px', xl: '22px' },
  '중간':   { r: '7px',  lg: '11px', xl: '15px' },
  '각지게': { r: '3px',  lg: '5px',  xl: '7px' },
};

function applyTheme(t) {
  const root = document.documentElement.style;
  const a = ACCENTS[t.accent] || ACCENTS['#EA851B'];
  root.setProperty('--orange', a[0]);
  root.setProperty('--orange-600', a[1]);
  root.setProperty('--orange-200', a[2]);
  const s = SURFACES[t.surface] || SURFACES['웜 페이퍼'];
  root.setProperty('--bg', s.bg);
  root.setProperty('--panel-2', s.p2);
  root.setProperty('--tint', s.tint);
  const rd = RADII[t.radius] || RADII['둥글게'];
  root.setProperty('--r', rd.r);
  root.setProperty('--r-lg', rd.lg);
  root.setProperty('--r-xl', rd.xl);
}

function useHashRoute() {
  const parse = () => {
    const h = (location.hash || '#/home').replace(/^#\//, '');
    return h.split('?')[0] || 'home';
  };
  const [route, setRoute] = useState(parse());
  useEffect(() => {
    const on = () => { setRoute(parse()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

function App() {
  const route = useHashRoute();
  const [group, setGroup] = useState(() => localStorage.getItem('dr_group') || 'g1');
  const setG = (g) => { setGroup(g); localStorage.setItem('dr_group', g); };
  const nav = (r) => { location.hash = `#/${r}`; };

  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  useEffect(() => { applyTheme(t); }, [t.accent, t.surface, t.radius]);

  let page;
  if (route === 'home')       page = <HomePage group={group} onNav={nav} />;
  else if (/^w[1-6]$/.test(route)) page = <WeekPage group={group} onGroup={setG} onNav={nav} weekN={+route.slice(1)} />;
  else if (route === 'demo')  page = <DemoPage group={group} />;
  else if (route === 'setup') page = <SetupPage group={group} />;
  else page = <HomePage group={group} onNav={nav} />;

  return (
    <div className="app">
      <TopBar route={route} group={group} onGroup={setG} />
      {page}
      <SiteFooter />
      <TweaksPanel>
        <TweakSection label="브랜드 강조색" />
        <TweakColor label="Accent" value={t.accent}
          options={['#EA851B', '#E0A21B', '#D2691E']}
          onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="표면 톤" />
        <TweakRadio label="Surface" value={t.surface}
          options={['웜 페이퍼', '쿨 그레이', '퓨어 화이트']}
          onChange={(v) => setTweak('surface', v)} />
        <TweakSection label="모서리" />
        <TweakRadio label="Radius" value={t.radius}
          options={['둥글게', '중간', '각지게']}
          onChange={(v) => setTweak('radius', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
