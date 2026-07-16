import { useState } from "react";
import { Plug, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { testConnection } from "../../api/client.js";

/* ============================================================================
   CONNECTION FORM — OPC UA endpoint + security + credentials, with a live
   "Test Connection" probe. A passing test calls onTested(true) so the parent
   can unlock the tag-mapping step.
============================================================================ */
const SECURITY_MODES = ["None", "Sign", "SignAndEncrypt"];
const SECURITY_POLICIES = [
  "None", "Basic128Rsa15", "Basic256", "Basic256Sha256",
  "Aes128_Sha256_RsaOaep", "Aes256_Sha256_RsaPss",
];

const labelCls = "mb-[0.3rem] block text-[0.5625rem] font-bold tracking-[0.16em] text-text-mid uppercase";
const fieldCls = "w-full rounded-md border border-border-line bg-surface-1 px-[0.7rem] py-[0.5rem] text-[0.8125rem] text-text-hi outline-none transition-colors focus:border-accent-blue";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

export default function ConnectionForm({ value, onChange, onTested }) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null); // { ok, serverName?, message?, error? }

  const set = (patch) => {
    onChange({ ...value, ...patch });
    setResult(null);       // any edit invalidates the previous test
    onTested(false);
  };

  async function runTest() {
    setTesting(true);
    setResult(null);
    try {
      const r = await testConnection(value);
      setResult(r);
      onTested(!!r.ok);
    } catch (e) {
      setResult({ ok: false, error: e.message });
      onTested(false);
    } finally {
      setTesting(false);
    }
  }

  const canTest = !testing && value.endpoint.trim().startsWith("opc.tcp://");

  return (
    <section className="rounded-lg border border-border-subtle bg-surface-2 p-[1.125rem] shadow-e2">
      <div className="mb-[1rem] flex items-center gap-[0.5rem]">
        <span className="flex size-[1.75rem] items-center justify-center rounded-md bg-bg-deep text-accent-cyan">
          <Plug style={{ width: "1rem", height: "1rem" }} strokeWidth={2} />
        </span>
        <h2 className="text-[0.9375rem] font-extrabold tracking-[0.06em] text-text-hi">
          <span className="text-text-low">Step 1 · </span>OPC UA Connection
        </h2>
      </div>

      <div className="flex flex-col gap-[0.875rem]">
        <Field label="Endpoint URL">
          <input
            className={fieldCls + " font-mono"}
            placeholder="opc.tcp://192.168.1.10:4840"
            value={value.endpoint}
            onChange={(e) => set({ endpoint: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-[1fr_1fr_auto] gap-[0.875rem]">
          <Field label="Security Mode">
            <select className={fieldCls} value={value.securityMode} onChange={(e) => set({ securityMode: e.target.value })}>
              {SECURITY_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Security Policy">
            <select className={fieldCls} value={value.securityPolicy} onChange={(e) => set({ securityPolicy: e.target.value })}>
              {SECURITY_POLICIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Namespace">
            <input
              className={fieldCls + " w-[5rem] text-center"}
              type="number"
              min="0"
              title="Default namespace index for bare tag addresses (Kepware = 2)"
              value={value.nsIndex ?? 2}
              onChange={(e) => set({ nsIndex: Number(e.target.value) })}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-[0.875rem]">
          <Field label="Username (optional)">
            <input className={fieldCls} autoComplete="off" value={value.username} onChange={(e) => set({ username: e.target.value })} />
          </Field>
          <Field label="Password (optional)">
            <input className={fieldCls} type="password" autoComplete="new-password" value={value.password} onChange={(e) => set({ password: e.target.value })} />
          </Field>
        </div>

        <div className="flex items-center gap-[0.875rem]">
          <button
            onClick={runTest}
            disabled={!canTest}
            className="flex cursor-pointer items-center gap-[0.5rem] rounded-md bg-accent-blue px-[1rem] py-[0.55rem] text-[0.8125rem] font-bold text-bg-deep transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {testing
              ? <Loader2 style={{ width: "1rem", height: "1rem" }} className="animate-spin" />
              : <Plug style={{ width: "1rem", height: "1rem" }} strokeWidth={2.5} />}
            {testing ? "Testing…" : "Test Connection"}
          </button>

          {result && (
            <span
              className="flex items-center gap-[0.4rem] text-[0.8125rem] font-semibold"
              style={{ color: result.ok ? "var(--color-status-run)" : "var(--color-status-stop)" }}
            >
              {result.ok
                ? <CheckCircle2 style={{ width: "1.05rem", height: "1.05rem" }} />
                : <XCircle style={{ width: "1.05rem", height: "1.05rem" }} />}
              {result.ok ? (result.message || "Connected") : `Failed: ${result.error}`}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
