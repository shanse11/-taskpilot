import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function ThemeToggle() {
  const [dark, setDark] = useState(() => window.localStorage.getItem("taskpilot.theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    window.localStorage.setItem("taskpilot.theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      aria-label={dark ? "切换浅色主题" : "切换深色主题"}
      className="grid size-10 place-items-center rounded-full border border-slate-200 bg-white/80 text-slate-700 shadow-sm transition hover:bg-white dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200"
      onClick={() => setDark((value) => !value)}
      type="button"
    >
      <span aria-hidden="true" className="text-lg">{dark ? "☼" : "☾"}</span>
    </button>
  );
}

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link className={`inline-flex items-center gap-3 no-underline ${inverse ? "text-white" : "text-slate-950 dark:text-white"}`} to="/projects" aria-label="TaskPilot 首页">
      <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-950/20">T</span>
      <span className="text-xl font-semibold tracking-tight">TaskPilot</span>
    </Link>
  );
}

export function WorkspaceHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
      setLoggingOut(false);
    }
  }

  const navClass = ({ isActive }: { isActive: boolean }) => `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"}`;

  return (
    <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-5 sm:gap-8">
        <Brand />
        <nav aria-label="主导航" className="flex items-center gap-1">
          <NavLink className={navClass} to="/projects">项目</NavLink>
          <NavLink className={navClass} to="/profile">个人资料</NavLink>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden max-w-36 truncate text-sm text-slate-500 dark:text-slate-400 sm:block">{user?.name}</span>
        <ThemeToggle />
        <button className="rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 sm:px-4" disabled={loggingOut} onClick={() => void handleLogout()} type="button">
          {loggingOut ? "正在退出…" : "退出登录"}
        </button>
      </div>
    </header>
  );
}
