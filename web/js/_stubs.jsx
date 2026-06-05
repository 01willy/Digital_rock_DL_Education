/* temporary stubs — replaced by full pages */
function Stub({ title }) {
  return <div className="page"><div className="card card-pad"><h2 className="h1">{title}</h2><p className="muted">곧 구현됩니다.</p></div></div>;
}
window.WeekPage = window.WeekPage || (() => <Stub title="W1 주차 페이지" />);
window.DemoPage = window.DemoPage || (() => <Stub title="인터랙티브 데모" />);
window.SetupPage = window.SetupPage || (() => <Stub title="환경 설치 가이드" />);
