import type { ReactNode } from "react";

export const formInputClass = "mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-950";
export const formLabelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300";
export const primaryButtonClass = "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-60";
export const secondaryButtonClass = "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800";
export const dangerButtonClass = "inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/60";

export function Modal({ title, children, onClose, size = "max-w-lg" }: { title: string; children: ReactNode; onClose: () => void; size?: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section aria-labelledby="modal-title" aria-modal="true" className={`my-auto w-full ${size} rounded-3xl border border-white/70 bg-white p-6 shadow-2xl shadow-slate-950/20 dark:border-white/10 dark:bg-slate-900 sm:p-8`} role="dialog">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">TaskPilot</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 dark:text-white" id="modal-title">{title}</h2>
          </div>
          <button aria-label="关闭对话框" className="grid size-9 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white" onClick={onClose} type="button">×</button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function ConfirmDialog({ title, message, busy, onCancel, onConfirm }: { title: string; message: string; busy?: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{message}</p>
      <div className="mt-7 flex justify-end gap-3">
        <button className={secondaryButtonClass} onClick={onCancel} type="button">取消</button>
        <button className={dangerButtonClass} disabled={busy} onClick={onConfirm} type="button">{busy ? "正在删除…" : "确认删除"}</button>
      </div>
    </Modal>
  );
}
