import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { signIn, signUp, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "登录 · 敏宝食谱" },
      { name: "description", content: "登录以在多设备同步你的排敏记录与食材库。" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (ready && user) {
    // 已登录,跳回首页
    void navigate({ to: "/" });
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email, pwd);
        void navigate({ to: "/" });
      } else {
        await signUp(email, pwd);
        setInfo("注册成功!如需邮箱验证,请查收邮件;否则可直接登录。");
        setMode("signin");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary text-2xl text-primary-foreground shadow-soft">
            🍼
          </div>
          <h1 className="mt-3 font-display text-xl font-extrabold">敏宝食谱</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === "signin" ? "登录后多设备同步" : "注册账号,保护你的排敏记录"}
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">邮箱</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">密码 (≥6 位)</label>
            <input
              type="password"
              required
              minLength={6}
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          {err && <p className="rounded-xl bg-danger/10 p-2 text-xs text-danger">{err}</p>}
          {info && <p className="rounded-xl bg-safe/10 p-2 text-xs text-safe">{info}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-soft disabled:opacity-50"
          >
            {busy ? "处理中…" : mode === "signin" ? "登录" : "注册并登录"}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          {mode === "signin" ? (
            <>
              还没账号?{" "}
              <button onClick={() => setMode("signup")} className="text-primary hover:underline">
                注册一个
              </button>
            </>
          ) : (
            <>
              已有账号?{" "}
              <button onClick={() => setMode("signin")} className="text-primary hover:underline">
                直接登录
              </button>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          本应用仅供家庭自用;数据加密存储,仅你本人可见。
        </p>
      </div>
    </div>
  );
}
