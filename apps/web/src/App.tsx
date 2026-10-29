import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";

function ThemeToggle() {
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

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link className={`inline-flex items-center gap-3 no-underline ${inverse ? "text-white" : "text-slate-950 dark:text-white"}`} to="/" aria-label="TaskPilot 首页">
      <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-950/20">T</span>
      <span className="text-xl font-semibold tracking-tight">TaskPilot</span>
    </Link>
  );
}

function AuthLayout({ children, mode }: { children: ReactNode; mode: "login" | "register" }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f7fb] px-4 py-6 text-slate-900 dark:bg-[#080c18] dark:text-slate-100 sm:px-8 sm:py-10">
      <div className="pointer-events-none absolute -left-36 top-20 size-80 rounded-full bg-indigo-300/30 blur-3xl dark:bg-indigo-700/20" />
      <div className="pointer-events-none absolute -right-32 bottom-0 size-96 rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-800/20" />
      <div className="relative mx-auto flex max-w-6xl items-center justify-between">
        <Brand />
        <ThemeToggle />
      </div>

      <div className="relative mx-auto mt-8 grid max-w-6xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 shadow-[0_30px_100px_-45px_rgba(35,40,90,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 lg:mt-12 lg:min-h-[640px] lg:grid-cols-[1.04fr_0.96fr]">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14" aria-label="TaskPilot 产品介绍">
          <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-8 -top-8 size-48 rounded-full border border-white/10" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-indigo-100">
              <span className="size-1.5 rounded-full bg-emerald-300" />
              给思路留出空间
            </span>
            <h1 className="mt-8 max-w-lg text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              把今天的计划，<br />变成明天的进展。
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-indigo-100/80">
              用清晰的项目和轻量的任务列表，找到下一步，然后安心向前。
            </p>
          </div>

          <div className="relative rounded-2xl border border-white/15 bg-white/[0.08] p-5 shadow-2xl shadow-indigo-950/20 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-medium text-indigo-100/70">本周重点</p>
                <p className="mt-1 text-sm font-semibold">产品发布准备</p>
              </div>
              <span className="rounded-full bg-emerald-300/15 px-2.5 py-1 text-xs font-medium text-emerald-200">进行中</span>
            </div>
            <div className="mt-4 space-y-3">
              {[
                { title: "整理发布清单", done: true },
                { title: "确认上线时间", done: false },
                { title: "准备团队同步", done: false },
              ].map((task) => (
                <div className="flex items-center gap-3 text-sm" key={task.title}>
                  <span className={`grid size-5 place-items-center rounded-md border ${task.done ? "border-indigo-300 bg-indigo-300 text-indigo-950" : "border-white/25 text-transparent"}`} aria-hidden="true">✓</span>
                  <span className={task.done ? "text-indigo-100/55 line-through" : "text-white/90"}>{task.title}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15"><div className="h-full w-1/3 rounded-full bg-indigo-300" /></div>
              <span className="text-xs text-indigo-100/70">1 / 3</span>
            </div>
          </div>
          <p className="relative text-xs text-indigo-100/55">TaskPilot · 专注下一步</p>
        </section>

        <section className="flex items-center px-6 py-10 sm:px-12 lg:px-12 xl:px-16" aria-labelledby="auth-heading">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 lg:hidden"><Brand /></div>
            <p className="text-sm font-semibold tracking-wide text-indigo-600 dark:text-indigo-300">
              {mode === "login" ? "欢迎回来" : "开启你的工作空间"}
            </p>
            <h2 id="auth-heading" className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
              {mode === "login" ? "登录 TaskPilot" : "创建你的账号"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {mode === "login" ? "继续管理项目，让重要的事保持清晰。" : "只需一分钟，就能开始整理你的下一步。"}
            </p>
            {children}
            <p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">
              {mode === "login" ? "还没有账号？" : "已经有账号？"}{" "}
              <Link className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300" to={mode === "login" ? "/register" : "/login"}>
                {mode === "login" ? "免费注册" : "前往登录"}
              </Link>
            </p>
          </div>
        </section>
      </div>
      <p className="relative mx-auto mt-6 max-w-6xl text-center text-xs text-slate-400 dark:text-slate-600">安全登录 · 你的个人工作空间</p>
    </main>
  );
}

const inputClass = "mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-950";
const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate("/profile", { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "登录失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout mode="login">
      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <label className={labelClass}>
          邮箱地址
          <input autoComplete="email" className={inputClass} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} />
        </label>
        <label className={labelClass}>
          密码
          <input autoComplete="current-password" className={inputClass} onChange={(event) => setPassword(event.target.value)} placeholder="输入你的密码" required type="password" value={password} />
        </label>
        {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300" role="alert">{error}</p>}
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-wait disabled:opacity-60" disabled={submitting} type="submit">
          {submitting ? "正在登录…" : "登录"}<span aria-hidden="true">→</span>
        </button>
      </form>
    </AuthLayout>
  );
}

function RegisterPage() {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(email.trim(), password, name.trim());
      await login(email.trim(), password);
      navigate("/profile", { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "注册失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout mode="register">
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className={labelClass}>
          姓名
          <input autoComplete="name" className={inputClass} maxLength={80} onChange={(event) => setName(event.target.value)} placeholder="你的名字" required value={name} />
        </label>
        <label className={labelClass}>
          邮箱地址
          <input autoComplete="email" className={inputClass} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} />
        </label>
        <label className={labelClass}>
          密码
          <input autoComplete="new-password" className={inputClass} minLength={8} onChange={(event) => setPassword(event.target.value)} placeholder="至少 8 个字符" required type="password" value={password} />
          <span className="mt-1.5 block text-xs font-normal text-slate-400">请使用至少 8 个字符</span>
        </label>
        {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300" role="alert">{error}</p>}
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-wait disabled:opacity-60" disabled={submitting} type="submit">
          {submitting ? "正在创建账号…" : "创建账号"}<span aria-hidden="true">→</span>
        </button>
      </form>
    </AuthLayout>
  );
}

function LoadingPage() {
  return <main className="grid min-h-screen place-items-center bg-[#f6f7fb] text-sm text-slate-500 dark:bg-[#080c18] dark:text-slate-400">正在验证登录状态…</main>;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingPage />;
  return user ? children : <Navigate replace to="/login" />;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingPage />;
  return user ? <Navigate replace to="/profile" /> : children;
}

function ProfilePage() {
  const { user, updateName, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => setName(user?.name ?? ""), [user?.name]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      await updateName(name.trim());
      setNotice("资料已保存");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
      setLoggingOut(false);
    }
  }

  if (!user) return <LoadingPage />;

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-6 text-slate-900 dark:bg-[#080c18] dark:text-slate-100 sm:px-8 sm:py-10">
      <header className="mx-auto flex max-w-5xl items-center justify-between">
        <Brand />
        <div className="flex items-center gap-3"><ThemeToggle /><button className="hidden rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 sm:inline-flex" onClick={() => void handleLogout()} type="button">{loggingOut ? "正在退出…" : "退出登录"}</button></div>
      </header>

      <div className="mx-auto mt-10 max-w-5xl lg:mt-16">
        <div className="mb-8">
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">个人空间</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">个人资料</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">管理你的 TaskPilot 账号信息。</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <section className="rounded-3xl bg-gradient-to-br from-indigo-700 via-violet-700 to-slate-950 p-7 text-white shadow-xl shadow-indigo-950/10">
            <div className="grid size-16 place-items-center rounded-2xl bg-white/15 text-2xl font-semibold ring-1 ring-white/20">{user.name.slice(0, 1).toUpperCase()}</div>
            <h2 className="mt-5 text-xl font-semibold">{user.name}</h2>
            <p className="mt-1 text-sm text-indigo-100/75">{user.email}</p>
            <div className="mt-8 rounded-2xl border border-white/15 bg-white/[0.08] p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-indigo-100/65">工作空间</p>
              <p className="mt-2 text-sm leading-6 text-white/90">你的项目与任务会安全地保存在个人账号下。</p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-white/10 dark:bg-slate-900 sm:p-8" aria-labelledby="profile-form-heading">
            <h2 id="profile-form-heading" className="text-lg font-semibold text-slate-900 dark:text-white">账号信息</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">更新其他人看到的姓名。邮箱暂时不可修改。</p>
            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
              <label className={labelClass}>
                姓名
                <input autoComplete="name" className={inputClass} maxLength={80} onChange={(event) => setName(event.target.value)} required value={name} />
              </label>
              <label className={labelClass}>
                邮箱地址
                <input className={`${inputClass} cursor-not-allowed bg-slate-50 text-slate-500 dark:bg-slate-800`} readOnly value={user.email} />
              </label>
              {notice && <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300" role="status">{notice}</p>}
              {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300" role="alert">{error}</p>}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-60" disabled={saving} type="submit">{saving ? "正在保存…" : "保存资料"}</button>
                <button className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 sm:hidden" disabled={loggingOut} onClick={() => void handleLogout()} type="button">{loggingOut ? "正在退出…" : "退出登录"}</button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
      <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
      <Route path="/" element={<Navigate replace to="/profile" />} />
      <Route path="*" element={<Navigate replace to="/profile" />} />
    </Routes>
  );
}

function App() {
  return <BrowserRouter><AuthProvider><AppRoutes /></AuthProvider></BrowserRouter>;
}

export default App;
