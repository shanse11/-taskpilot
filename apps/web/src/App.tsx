const summaryCards = [
  { label: "进行中", value: "—", detail: "任务完成后会显示在这里" },
  { label: "即将到期", value: "—", detail: "保持重要事项在视线内" },
  { label: "已完成", value: "—", detail: "每一步进展都值得记录" },
];

function App() {
  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between">
          <a className="flex items-center gap-3 text-slate-900 no-underline" href="/" aria-label="TaskPilot 首页">
            <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-sm shadow-indigo-200">
              T
            </span>
            <span className="text-xl font-semibold tracking-tight">TaskPilot</span>
          </a>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
            本地工作区
          </span>
        </header>

        <section className="mt-14 max-w-2xl sm:mt-20" aria-labelledby="welcome-heading">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">清晰计划，从容推进</p>
          <h1 id="welcome-heading" className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            让重要的事情，<br className="hidden sm:block" />一步一步完成。
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            你的任务工作台已经准备就绪。接下来可以创建项目、安排任务，并在一个安静清晰的空间里跟进进度。
          </p>
          <button
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            type="button"
            disabled
            title="项目创建功能将在后续阶段启用"
          >
            <span aria-hidden="true">＋</span>
            创建第一个项目
          </button>
        </section>

        <section className="mt-14 grid gap-4 sm:grid-cols-3" aria-label="任务概览">
          {summaryCards.map((card) => (
            <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/40" key={card.label}>
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="mt-5 text-3xl font-semibold tracking-tight text-slate-900">{card.value}</p>
              <p className="mt-2 text-sm text-slate-500">{card.detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center" aria-labelledby="projects-heading">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-indigo-50 text-xl text-indigo-600" aria-hidden="true">
            ◫
          </div>
          <h2 id="projects-heading" className="mt-4 text-lg font-semibold text-slate-900">项目空间即将就绪</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            当前是脚手架首页。完成账号、项目和任务模块后，这里会成为你的项目列表。
          </p>
        </section>

        <footer className="mt-10 border-t border-slate-200/80 pt-5 text-xs text-slate-400">
          TaskPilot · 专注下一步
        </footer>
      </div>
    </main>
  );
}

export default App;
