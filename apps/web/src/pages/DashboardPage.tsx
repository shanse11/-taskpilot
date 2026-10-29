import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { WorkspaceHeader } from "../components/WorkspaceChrome";
import { dashboardApi, downloadTasksCsv, type DashboardStats } from "../lib/dashboard-api";
import { projectsApi, type Project } from "../lib/projects-api";

const pageClass = "min-h-screen bg-[#f6f7fb] px-4 py-6 text-slate-900 dark:bg-[#080c18] dark:text-slate-100 sm:px-8 sm:py-10";
const panelClass = "rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6";

const statusItems = [
  { key: "todo", label: "待办", color: "bg-slate-400", stroke: "stroke-slate-400" },
  { key: "in_progress", label: "进行中", color: "bg-indigo-500", stroke: "stroke-indigo-500" },
  { key: "done", label: "已完成", color: "bg-emerald-500", stroke: "stroke-emerald-500" },
] as const;
const priorityItems = [
  { key: "high", label: "高", color: "bg-rose-500" },
  { key: "medium", label: "中", color: "bg-amber-500" },
  { key: "low", label: "低", color: "bg-slate-400" },
] as const;

function StatCard({ label, value, detail, tone }: { label: string; value: string | number; detail: string; tone: string }) {
  return (
    <article className={panelClass}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>
        </div>
        <span aria-hidden="true" className={`grid size-10 place-items-center rounded-xl text-lg ${tone}`}>●</span>
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-400 dark:text-slate-500">{detail}</p>
    </article>
  );
}

function StatusChart({ stats }: { stats: DashboardStats }) {
  const total = stats.totalTasks;
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <section aria-label="按状态分布" className={panelClass}>
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">状态分布</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">查看任务当前所处阶段</p>
      </div>
      {total === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center text-center">
          <div className="grid size-32 place-items-center rounded-full border-[12px] border-slate-100 text-2xl font-semibold text-slate-300 dark:border-slate-800 dark:text-slate-600">0</div>
          <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">还没有可展示的任务</p>
        </div>
      ) : (
        <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
          <div className="relative size-44 shrink-0">
            <svg aria-label={`共 ${total} 个任务的状态分布`} className="size-full -rotate-90" role="img" viewBox="0 0 120 120">
              <circle className="stroke-slate-100 dark:stroke-slate-800" cx="60" cy="60" fill="none" r={radius} strokeWidth="12" />
              {statusItems.map((item) => {
                const count = stats.statusDistribution[item.key];
                const segment = total === 0 ? 0 : count / total * circumference;
                const currentOffset = offset;
                offset += segment;
                return <circle className={item.stroke} cx="60" cy="60" fill="none" key={item.key} r={radius} strokeDasharray={`${segment} ${circumference - segment}`} strokeDashoffset={-currentOffset} strokeWidth="12" />;
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-semibold text-slate-950 dark:text-white">{total}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">个任务</span>
            </div>
          </div>
          <ul className="w-full space-y-3 sm:max-w-44">
            {statusItems.map((item) => (
              <li className="flex items-center justify-between gap-3 text-sm" key={item.key}>
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><span aria-hidden="true" className={`size-2.5 rounded-full ${item.color}`} />{item.label}</span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{stats.statusDistribution[item.key]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function PriorityChart({ stats }: { stats: DashboardStats }) {
  const maxCount = Math.max(...priorityItems.map((item) => stats.priorityDistribution[item.key]), 1);
  return (
    <section aria-label="按优先级分布" className={panelClass}>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">优先级分布</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">快速了解任务轻重缓急</p>
      <div className="mt-7 space-y-6">
        {priorityItems.map((item) => {
          const count = stats.priorityDistribution[item.key];
          const width = stats.totalTasks === 0 ? 0 : count / maxCount * 100;
          return (
            <div key={item.key}>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-slate-600 dark:text-slate-300">{item.label}优先级</span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{count}</span>
              </div>
              <div aria-label={`${item.label}优先级 ${count} 个任务`} className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="img">
                <div className={`h-full rounded-full transition-all ${item.color}`} style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      {stats.totalTasks === 0 && <p className="mt-6 text-center text-sm text-slate-400 dark:text-slate-500">创建任务后，这里会显示优先级分布。</p>}
    </section>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [exportError, setExportError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([dashboardApi.stats(projectId || undefined), projectsApi.list()])
      .then(([statsResult, projectsResult]) => {
        if (!active) return;
        setStats(statsResult.stats);
        setProjects(projectsResult.projects);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "无法加载仪表盘数据");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [projectId, reloadKey]);

  async function exportCsv() {
    setExportError("");
    setNotice("");
    setExporting(true);
    try {
      await downloadTasksCsv();
      setNotice("CSV 已开始下载");
    } catch (cause) {
      setExportError(cause instanceof Error ? cause.message : "导出失败，请稍后重试");
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className={pageClass}>
      <WorkspaceHeader />
      <div className="mx-auto mt-9 max-w-6xl sm:mt-12">
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">工作空间概览</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">数据仪表盘</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">查看任务进度、截止情况和优先级分布。</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <label className="sr-only" htmlFor="dashboard-project">筛选项目</label>
            <select className="min-h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-500 dark:focus:ring-indigo-950 sm:min-w-48" id="dashboard-project" onChange={(event) => setProjectId(event.target.value)} value={projectId}>
              <option value="">所有项目</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-wait disabled:opacity-60" disabled={exporting} onClick={() => void exportCsv()} type="button">
              <span aria-hidden="true">↓</span>{exporting ? "正在导出…" : "导出 CSV"}
            </button>
          </div>
        </section>

        {notice && <p className="mt-5 text-sm font-medium text-emerald-700 dark:text-emerald-300" role="status">{notice}</p>}
        {exportError && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300" role="alert">{exportError}</p>}
        {error && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300" role="alert"><span>{error}</span><button className="font-semibold underline" onClick={() => setReloadKey((value) => value + 1)} type="button">重试</button></div>}

        {loading ? (
          <div aria-label="正在加载仪表盘" className="mt-7 space-y-5" role="status">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div className="h-36 animate-pulse rounded-3xl bg-white dark:bg-slate-900" key={item} />)}</div>
            <div className="grid gap-5 lg:grid-cols-2"><div className="h-80 animate-pulse rounded-3xl bg-white dark:bg-slate-900" /><div className="h-80 animate-pulse rounded-3xl bg-white dark:bg-slate-900" /></div>
          </div>
        ) : stats ? (
          <>
            <section aria-label="任务统计" className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard detail="所选范围内的全部任务" label="任务总数" tone="bg-indigo-50 text-indigo-500 dark:bg-indigo-400/10 dark:text-indigo-300" value={stats.totalTasks} />
              <StatCard detail="状态为已完成的任务" label="已完成" tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300" value={stats.completedTasks} />
              <StatCard detail="截止日期已过且尚未完成" label="逾期任务" tone="bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300" value={stats.overdueTasks} />
              <StatCard detail="已完成任务占全部任务的比例" label="完成率" tone="bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300" value={`${stats.completionRate}%`} />
            </section>

            {stats.totalTasks === 0 && (
              <section className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-7 text-center dark:border-slate-700 dark:bg-slate-900/70">
                <h2 className="font-semibold text-slate-900 dark:text-white">还没有任务数据</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">创建一个项目并添加任务后，仪表盘就会显示进度和分布。</p>
                <Link className="mt-4 inline-flex rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500" to="/projects">前往项目</Link>
              </section>
            )}

            <section aria-label="任务分布图表" className="mt-5 grid gap-5 lg:grid-cols-2">
              <StatusChart stats={stats} />
              <PriorityChart stats={stats} />
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
