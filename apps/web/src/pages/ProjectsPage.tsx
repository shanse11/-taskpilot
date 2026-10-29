import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ConfirmDialog, formInputClass, formLabelClass, Modal, primaryButtonClass, secondaryButtonClass } from "../components/Modal";
import { WorkspaceHeader } from "../components/WorkspaceChrome";
import { projectsApi, type Project, type ProjectInput, type ProjectStatus } from "../lib/projects-api";

const pageClass = "min-h-screen bg-[#f6f7fb] px-4 py-6 text-slate-900 dark:bg-[#080c18] dark:text-slate-100 sm:px-8 sm:py-10";

function ProjectDialog({ project, onClose, onSave }: { project: Project | null; onClose: () => void; onSave: (input: ProjectInput) => Promise<void> }) {
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "active");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave({ name: name.trim(), description: description.trim() || null, status });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "保存项目失败，请重试");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={project ? "编辑项目" : "创建项目"} onClose={onClose}>
      <form className="space-y-5" onSubmit={(event) => void submit(event)}>
        <label className={formLabelClass}>项目名称
          <input autoFocus className={formInputClass} maxLength={120} onChange={(event) => setName(event.target.value)} placeholder="例如：产品发布" required value={name} />
        </label>
        <label className={formLabelClass}>项目描述
          <textarea className={`${formInputClass} min-h-24 resize-y`} maxLength={5000} onChange={(event) => setDescription(event.target.value)} placeholder="写下项目目标或背景（可选）" value={description} />
        </label>
        {project && <label className={formLabelClass}>项目状态
          <select className={formInputClass} onChange={(event) => setStatus(event.target.value as ProjectStatus)} value={status}>
            <option value="active">进行中</option><option value="archived">已归档</option>
          </select>
        </label>}
        {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300" role="alert">{error}</p>}
        <div className="flex justify-end gap-3 pt-1">
          <button className={secondaryButtonClass} onClick={onClose} type="button">取消</button>
          <button className={primaryButtonClass} disabled={saving} type="submit">{saving ? "正在保存…" : project ? "保存更改" : "创建项目"}</button>
        </div>
      </form>
    </Modal>
  );
}

function StatusPill({ status }: { status: ProjectStatus }) {
  const archived = status === "archived";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${archived ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"}`}><span className={`size-1.5 rounded-full ${archived ? "bg-slate-400" : "bg-emerald-500"}`} />{archived ? "已归档" : "进行中"}</span>;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<"all" | ProjectStatus>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function loadProjects() {
    setLoading(true);
    setError("");
    try {
      const result = await projectsApi.list();
      setProjects(result.projects);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "无法加载项目");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadProjects(); }, []);

  async function saveProject(input: ProjectInput) {
    if (editing) await projectsApi.update(editing.id, input);
    else await projectsApi.create(input);
    setDialogOpen(false);
    setEditing(null);
    setNotice(editing ? "项目已更新" : "项目已创建");
    await loadProjects();
  }

  async function deleteProject() {
    if (!deleting) return;
    setDeleteBusy(true);
    setError("");
    try {
      await projectsApi.delete(deleting.id);
      setDeleting(null);
      setNotice("项目及其任务已删除");
      await loadProjects();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "删除项目失败");
    } finally {
      setDeleteBusy(false);
    }
  }

  const shownProjects = filter === "all" ? projects : projects.filter((project) => project.status === filter);

  return (
    <main className={pageClass}>
      <WorkspaceHeader />
      <div className="mx-auto mt-10 max-w-6xl lg:mt-16">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-700 via-violet-700 to-slate-950 p-7 text-white shadow-xl shadow-indigo-950/10 sm:p-10">
          <div className="pointer-events-none absolute -right-10 -top-24 size-80 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute right-24 top-20 size-36 rounded-full border border-white/10" />
          <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-indigo-200">你的工作空间</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">项目</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100/75">把目标拆解为清晰的下一步，跟踪每个项目的进度。</p>
            </div>
            <button className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-800 shadow-lg transition hover:bg-indigo-50" onClick={() => { setEditing(null); setDialogOpen(true); }} type="button"><span aria-hidden="true" className="text-lg">＋</span>新建项目</button>
          </div>
          <div className="relative mt-8 flex flex-wrap gap-2 border-t border-white/15 pt-5 text-sm">
            <span className="mr-2 self-center text-indigo-100/60">{projects.length} 个项目</span>
            {([ ["all", "全部"], ["active", "进行中"], ["archived", "已归档"] ] as const).map(([value, label]) => (
              <button className={`rounded-full px-3 py-1.5 transition ${filter === value ? "bg-white/20 text-white" : "text-indigo-100/70 hover:bg-white/10 hover:text-white"}`} key={value} onClick={() => setFilter(value)} type="button">{label}</button>
            ))}
          </div>
        </section>

        {notice && <p className="mt-5 text-sm font-medium text-emerald-700 dark:text-emerald-300" role="status">{notice}</p>}
        {error && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300" role="alert"><span>{error}</span><button className="font-semibold underline" onClick={() => void loadProjects()} type="button">重试</button></div>}

        {loading ? (
          <div aria-label="正在加载项目" className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status">{[0, 1, 2].map((item) => <div className="h-52 animate-pulse rounded-3xl border border-slate-200 bg-white/70 dark:border-white/10 dark:bg-slate-900/70" key={item} />)}</div>
        ) : shownProjects.length === 0 ? (
          <section className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/50">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">◇</div>
            <h2 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">{projects.length === 0 ? "从一个项目开始" : "这里还没有项目"}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{projects.length === 0 ? "创建项目后，就可以用任务看板规划进度。" : "切换状态筛选，或创建一个新项目。"}</p>
            {projects.length === 0 && <button className={`${primaryButtonClass} mt-6`} onClick={() => { setEditing(null); setDialogOpen(true); }} type="button">创建第一个项目</button>}
          </section>
        ) : (
          <section aria-label="项目列表" className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shownProjects.map((project) => (
              <article className="group relative flex min-h-56 flex-col rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/40 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-950/5 dark:border-white/10 dark:bg-slate-900 dark:shadow-none dark:hover:border-indigo-400/30" key={project.id}>
                <div className="flex items-start justify-between gap-3"><StatusPill status={project.status} /><span className="text-xs text-slate-400">{new Date(project.updatedAt).toLocaleDateString("zh-CN")}</span></div>
                <Link className="mt-5 block rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-950" to={`/projects/${project.id}`}>
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900 transition group-hover:text-indigo-700 dark:text-white dark:group-hover:text-indigo-300">{project.name}</h2>
                  <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500 dark:text-slate-400">{project.description || "暂无描述"}</p>
                </Link>
                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/5">
                  <Link className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300" to={`/projects/${project.id}`}>{project._count.tasks} 个任务<span aria-hidden="true">→</span></Link>
                  <div className="flex gap-1">
                    <button aria-label={`编辑 ${project.name}`} className="grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/10 dark:hover:text-white" onClick={() => { setEditing(project); setDialogOpen(true); }} type="button">✎</button>
                    <button aria-label={`删除 ${project.name}`} className="grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-300" onClick={() => setDeleting(project)} type="button">⌫</button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
      {dialogOpen && <ProjectDialog key={editing?.id ?? "new"} onClose={() => { setDialogOpen(false); setEditing(null); }} onSave={saveProject} project={editing} />}
      {deleting && <ConfirmDialog busy={deleteBusy} message={`“${deleting.name}”及其中的任务都会被永久删除。`} onCancel={() => setDeleting(null)} onConfirm={() => void deleteProject()} title="删除项目？" />}
    </main>
  );
}
