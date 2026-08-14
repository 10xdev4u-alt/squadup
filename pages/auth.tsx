import { useState } from "react";
import { useRouter } from "next/router";
import { api, getApiErrorMessage } from "@/lib/api";
import { needsOnboarding } from "@/lib/needs-onboarding";

type Step = "email" | "otp";

export default function AuthPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [otpId, setOtpId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    setBusy(true);
    setError(null);
    try {
      const res = await api().auth.requestOtp(email);
      setOtpId(res.otpId);
      setStep("otp");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!otpId) return;
    setBusy(true);
    setError(null);
    try {
      const session = await api().auth.verifyOtp(otpId, code);
      router.replace(
        needsOnboarding(session.user) ? "/onboarding" : "/discover"
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground md:grid md:grid-cols-2">
      {/* Brand side (§9 split-screen) */}
      <div className="hidden flex-col justify-center gap-4 bg-gradient-to-br from-primary/20 via-background to-background p-12 md:flex">
        <h1 className="font-display text-5xl font-bold">SquadUp</h1>
        <p className="max-w-sm text-lg text-muted-foreground">
          Find Your Squad. Build Something Real.
        </p>
      </div>

      {/* Form side */}
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 p-6">
        <h2 className="text-2xl font-bold">
          {step === "email" ? "Get your login code" : "Check your inbox"}
        </h2>

        {step === "email" ? (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void sendCode();
            }}
          >
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">College email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? "auth-error" : undefined}
                className="rounded-control border border-input bg-background px-3 py-2 outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </label>
            {error && (
              <p id="auth-error" className="text-sm text-danger">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="rounded-control bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
            >
              {busy ? "Sending..." : "Get code"}
            </button>
          </form>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void verify();
            }}
          >
            <p className="text-sm text-muted-foreground">
              A one-time code was sent to {email}.
            </p>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Verification code</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? "auth-error" : undefined}
                className="rounded-control border border-input bg-background px-3 py-2 outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </label>
            {error && (
              <p id="auth-error" className="text-sm text-danger">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="rounded-control bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
            >
              {busy ? "Verifying..." : "Verify and continue"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void sendCode()}
              className="text-sm text-muted-foreground underline underline-offset-4"
            >
              Resend code
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
