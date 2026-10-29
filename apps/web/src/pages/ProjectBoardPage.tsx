import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ConfirmDialog, dangerButtonClass, formInputClass, formLabelClass, Modal, primaryButtonClass, secondaryButtonClass } from "../components/Modal";
import { WorkspaceHeader } from "../components/WorkspaceChrome";
import { projectsApi, tasksApi, type Project, type Task, type TaskInput, type TaskPriority, type TaskStatus } from "../lib/projects-api";

const pageClass = "min-h-screen bg-[#f6f7fb] px-4 py-6 text-slate-900 dark:bg-[#080c18] dark:text-slate-100 sm:px-8 sm:py-10";
const statusColumns: { id: TaskStatus; title: string; color: string; empty: string }[] = [
  { id: "todo", title: "待办", color: "bg-slate-400", empty: "还没有待办任务" },
  { id: "in_progress", title: "进行中", color: "bg-indigo-500", empty: "把任务拖到这里" },
  { id: "done", title: "已完成", color: "bg-emerald-500", empty: "完成的任务会出现在这里" },
];
const priorityNames: Record<TaskPriority, string> = { low: "低优先级", medium: "中优先级", high: "高优先级" };

function TaskDialog({ task, defaultStatus, onClose, onSave, onDelete }: {
  task: Task | null;
  defaultStatus: TaskStatus;
  onClose: () => void;
  onSave: (input: TaskInput) => Promise<void>;
  onDelete: (task: Task) => Promise<void>;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaultStatus);
  const [dueDate, setDueDate] = useState(task?.dueDate?.slice(0, 10) ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave({ title: title.trim(), description: description.trim() || null, priority, status, dueDate: dueDate || null });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "保存任务失败，请重试");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!task) return;
    setDeleting(true);
    setError("");
    try {
      await onDelete(task);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "删除任务失败");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <>
      <Modal size="max-w-xl" title={task ? "编辑任务" : "新建任务"} onClose={onClose}>
        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <label className={formLabelClass}>任务标题
            <input autoFocus className={formInputClass} maxLength={200} onChange={(event) => setTitle(event.target.value)} placeholder="写下要完成的事情" required value={title} />
          </label>
          <label className={formLabelClass}>描述
            <textarea className={`${formInputClass} min-h-24 resize-y`} maxLength={10000} onChange={(event) => setDescription(event.target.value)} placeholder="补充任务细节（可选）" value={description} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={formLabelClass}>状态
              <select className={formInputClass} onChange={(event) => setStatus(event.target.value as TaskStatus)} value={status}>
                <option value="todo">待办</option><option value="in_progress">进行中</option><option value="done">已完成</option>
              </select>
            </label>
            <label className={formLabelClass}>优先级
              <select className={formInputClass} onChange={(event) => setPriority(event.target.value as TaskPriority)} value={priority}>
                <option value="low">低</option><option value="medium">中</option><option value="high">高</option>
              </select>
            </label>
          </div>
          <label className={formLabelClass}>截止日期
            <input className={formInputClass} onChange={(event) => setDueDate(event.target.value)} type="date" value={dueDate} />
          </label>
          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300" role="alert">{error}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5 dark:border-white/10">
            {task ? <button className={dangerButtonClass} disabled={deleting} onClick={() => setConfirmDelete(true)} type="button">删除任务</button> : <span />}
            <div className="ml-auto flex gap-3">
              <button className={secondaryButtonClass} onClick={onClose} type="button">取消</button>
              <button className={primaryButtonClass} disabled={saving} type="submit">{saving ? "正在保存…" : task ? "保存更改" : "创建任务"}</button>
            </div>
          </div>
        </form>
      </Modal>
      {confirmDelete && task && <ConfirmDialog busy={deleting} message={`“${task.title}”将被永久删除。`} onCancel={() => setConfirmDelete(false)} onConfirm={() => void remove()} title="删除任务？" />}
    </>
  );
}

function PriorityPill({ priority }: { priority: TaskPriority }) {
  const style = priority === "high"
    ? "bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300"
    : priority === "medium"
      ? "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"
      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${style}`}>{priorityNames[priority]}</span>;
}

function dueDateLabel(value: string | null): { label: string; overdue: boolean } | null {
  if (!value) return null;
  const date = new Date(value);
  const dueDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return { label: date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" }), overdue: dueDay < todayStart };
}

function TaskCard({ task, onEdit, onDragStart, onDrop }: { task: Task; onEdit: () => void; onDragStart: (event: DragEvent<HTMLDivElement>) => void; onDrop: (event: DragEvent<HTMLDivElement>) => void }) {
  const due = dueDateLabel(task.dueDate);
  return (
    <article className="group rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm shadow-slate-200/50 transition hover:border-indigo-200 hover:shadow-md dark:border-white/10 dark:bg-slate-900 dark:shadow-none dark:hover:border-indigo-400/30" draggable onDragStart={onDragStart} onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
      <div className="flex items-start justify-between gap-3">
        <button className="text-left text-sm font-semibold leading-5 text-slate-800 outline-none hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-400 dark:text-slate-100 dark:hover:text-indigo-300" onClick={onEdit} type="button">{task.title}</button>
        <button aria-label={`编辑 ${task.title}`} className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-300 opacity-100 transition hover:bg-slate-100 hover:text-slate-700 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:bg-white/10 dark:hover:text-white" onClick={onEdit} type="button">···</button>
      </div>
      {task.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{task.description}</p>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <PriorityPill priority={task.priority} />
        {due && <span className={`text-xs font-medium ${due.overdue && task.status !== "done" ? "text-rose-600 dark:text-rose-300" : "text-slate-400 dark:text-slate-500"}`}>{due.overdue && task.status !== "done" ? "逾期 · " : "截止 "}{due.label}</span>}
      </div>
      <div aria-hidden="true" className="mt-3 flex items-center gap-1 text-[10px] tracking-widest text-slate-300 opacity-0 transition group-hover:opacity-100 dark:text-slate-600"><span>⠿</span><span>拖动任务</span></div>
    </article>
  );
}

export default function ProjectBoardPage() {
  const { projectId = "" } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskSummary, setTaskSummary] = useState({ total: 0, todo: 0, in_progress: 0, done: 0 });
  const [status, setStatus] = useState<TaskStatus | "">("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("position");
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("todo");
  const draggedTaskId = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      projectsApi.get(projectId),
      tasksApi.list(projectId, { status, priority, q: search, sort }),
    ]).then(([projectResult, taskResult]) => {
      if (!active) return;
      setProject(projectResult.project);
      setTaskSummary(projectResult.taskSummary);
      setTasks(taskResult.tasks);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : "无法加载项目任务");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [projectId, status, priority, search, sort, reloadKey]);

  function openCreate(nextStatus: TaskStatus = "todo") {
    setTaskToEdit(null);
    setDefaultStatus(nextStatus);
    setDialogOpen(true);
  }

  async function saveTask(input: TaskInput) {
    if (taskToEdit) await tasksApi.update(taskToEdit.id, input);
    else await tasksApi.create(projectId, input);
    setNotice(taskToEdit ? "任务已更新" : "任务已创建");
    setReloadKey((value) => value + 1);
  }

  async function deleteTask(task: Task) {
    await tasksApi.delete(task.id);
    setNotice("任务已删除");
    setReloadKey((value) => value + 1);
  }

  async function moveTask(taskId: string, nextStatus: TaskStatus, position: number) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task || (task.status === nextStatus && task.position === position)) return;
    setError("");
    setNotice("");
    try {
      await tasksApi.updateStatus(taskId, nextStatus, position);
      setNotice("任务状态已更新");
      setReloadKey((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "更新任务状态失败");
    } finally {
      draggedTaskId.current = null;
    }
  }

  function beginDrag(task: Task, event: DragEvent<HTMLDivElement>) {
    draggedTaskId.current = task.id;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", task.id);
  }

  function dropOn(statusId: TaskStatus, position: number, event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    const taskId = event.dataTransfer.getData("text/plain") || draggedTaskId.current;
    if (taskId) void moveTask(taskId, statusId, position);
  }

  if (loading && !project) {
    return <main className={pageClass}><WorkspaceHeader /><div className="mx-auto mt-12 max-w-6xl"><div className="h-10 w-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" /><div className="mt-8 grid gap-5 lg:grid-cols-3">{[0, 1, 2].map((item) => <div className="h-[28rem] animate-pulse rounded-3xl bg-white dark:bg-slate-900" key={item} />)}</div></div></main>;
  }

  if (!project) {
    return <main className={pageClass}><WorkspaceHeader /><section className="mx-auto mt-16 max-w-2xl rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-900/60 dark:bg-rose-950/30"><h1 className="text-xl font-semibold">无法打开项目</h1><p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{error || "项目不存在或你没有访问权限。"}</p><Link className="mt-5 inline-flex font-semibold text-indigo-600 dark:text-indigo-300" to="/projects">返回项目列表</Link></section></main>;
  }

  return (
    <main className={pageClass}>
      <WorkspaceHeader />
      <div className="mx-auto mt-9 max-w-6xl">
        <Link className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300" to="/projects"><span aria-hidden="true">←</span>所有项目</Link>
        <section className="mt-5 flex flex-col justify-between gap-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:flex-row sm:items-center sm:p-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3"><p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">项目看板</p>{project.status === "archived" && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">已归档</span>}</div>
            <h1 className="mt-2 truncate text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{project.name}</h1>
            {project.description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{project.description}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-5 rounded-2xl bg-slate-50 px-5 py-3 dark:bg-slate-800/70">
            <div className="text-center"><p className="text-lg font-semibold text-slate-900 dark:text-white">{taskSummary.total}</p><p className="text-[11px] font-medium text-slate-400">全部</p></div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="text-center"><p className="text-lg font-semibold text-indigo-600 dark:text-indigo-300">{taskSummary.in_progress}</p><p className="text-[11px] font-medium text-slate-400">进行中</p></div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="text-center"><p className="text-lg font-semibold text-emerald-600 dark:text-emerald-300">{taskSummary.done}</p><p className="text-[11px] font-medium text-slate-400">已完成</p></div>
          </div>
        </section>

        <section aria-label="任务筛选与排序" className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-900/80 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1"><span className="sr-only">搜索任务</span><span aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">⌕</span><input className={`${formInputClass} mt-0 pl-10`} onChange={(event) => setSearch(event.target.value)} placeholder="搜索任务标题或描述…" value={search} /></label>
          <label><span className="sr-only">筛选状态</span><select className={`${formInputClass} mt-0 min-w-32 py-3`} onChange={(event) => setStatus(event.target.value as TaskStatus | "")} value={status}><option value="">所有状态</option><option value="todo">待办</option><option value="in_progress">进行中</option><option value="done">已完成</option></select></label>
          <label><span className="sr-only">筛选优先级</span><select className={`${formInputClass} mt-0 min-w-32 py-3`} onChange={(event) => setPriority(event.target.value as TaskPriority | "")} value={priority}><option value="">所有优先级</option><option value="high">高优先级</option><option value="medium">中优先级</option><option value="low">低优先级</option></select></label>
          <label><span className="sr-only">任务排序</span><select className={`${formInputClass} mt-0 min-w-36 py-3`} onChange={(event) => setSort(event.target.value)} value={sort}><option value="position">手动排序</option><option value="dueDate">截止日期 ↑</option><option value="-dueDate">截止日期 ↓</option><option value="priority">优先级 ↑</option><option value="-priority">优先级 ↓</option><option value="title">标题 A-Z</option><option value="-title">标题 Z-A</option><option value="-createdAt">最近创建</option></select></label>
          <button className={`${primaryButtonClass} shrink-0 px-4`} onClick={() => openCreate()} type="button"><span aria-hidden="true">＋</span><span className="hidden sm:inline">新建任务</span><span className="sm:hidden">新建</span></button>
        </section>

        {notice && <p className="mt-4 text-sm font-medium text-emerald-700 dark:text-emerald-300" role="status">{notice}</p>}
        {error && <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300" role="alert"><span>{error}</span><button className="font-semibold underline" onClick={() => setReloadKey((value) => value + 1)} type="button">重试</button></div>}

        {loading ? <div aria-label="正在加载任务" className="mt-6 grid gap-5 lg:grid-cols-3" role="status">{[0, 1, 2].map((item) => <div className="h-[26rem] animate-pulse rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900" key={item} />)}</div> : (
          <section aria-label="任务看板" className="mt-6 grid items-start gap-4 lg:grid-cols-3 lg:gap-5">
            {statusColumns.map((column) => {
              const columnTasks = tasks.filter((task) => task.status === column.id);
              return (
                <section aria-label={`${column.title}任务`} className="min-h-72 rounded-3xl border border-slate-200/80 bg-slate-100/70 p-3.5 dark:border-white/10 dark:bg-slate-900/60 sm:p-4" key={column.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropOn(column.id, columnTasks.length, event)}>
                  <header className="flex items-center justify-between px-1 pb-3">
                    <div className="flex items-center gap-2.5"><span className={`size-2 rounded-full ${column.color}`} /><h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{column.title}</h2><span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-400 dark:bg-slate-800">{columnTasks.length}</span></div>
                    <button aria-label={`在${column.title}中新建任务`} className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-300" onClick={() => openCreate(column.id)} type="button">＋</button>
                  </header>
                  <div className="space-y-3">
                    {columnTasks.map((task, index) => (
                      <TaskCard key={task.id} onDragStart={(event) => beginDrag(task, event)} onDrop={(event) => dropOn(column.id, index, event)} onEdit={() => { setTaskToEdit(task); setDefaultStatus(task.status); setDialogOpen(true); }} task={task} />
                    ))}
                    {columnTasks.length === 0 && <button className="flex min-h-28 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 px-4 text-center transition hover:border-indigo-300 hover:bg-white/60 dark:border-slate-700 dark:hover:border-indigo-400/40 dark:hover:bg-white/[0.03]" onClick={() => openCreate(column.id)} type="button"><span className="text-sm font-medium text-slate-500 dark:text-slate-400">{column.empty}</span><span className="mt-2 text-xs text-indigo-600 dark:text-indigo-300">＋ 添加任务</span></button>}
                  </div>
                </section>
              );
            })}
          </section>
        )}
        <p className="mt-5 text-center text-xs text-slate-400 dark:text-slate-600">拖动任务卡片可更改状态，也可以打开任务编辑状态与排序。</p>
      </div>
      {dialogOpen && <TaskDialog key={taskToEdit?.id ?? `new-${defaultStatus}`} defaultStatus={defaultStatus} onClose={() => setDialogOpen(false)} onDelete={deleteTask} onSave={saveTask} task={taskToEdit} />}
    </main>
  );
}
