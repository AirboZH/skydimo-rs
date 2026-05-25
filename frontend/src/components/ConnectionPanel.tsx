import { useEffect, useState } from "react";
import { ThemeTokens, FONTS } from "../lib/theme";
import { ipc } from "../lib/ipc";
import { ModelInfo, PortInfo, StateSnapshot } from "../lib/types";
import { Icon } from "./Icon";

interface Props {
  t: ThemeTokens;
  state: StateSnapshot;
  onClose: () => void;
  onState: (next: StateSnapshot) => void;
}

export function ConnectionPanel({ t, state, onClose, onState }: Props) {
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>(state.port ?? "");
  const [selectedModel, setSelectedModel] = useState<string>(state.model ?? "SK0121");
  const [customLeds, setCustomLeds] = useState<number>(state.n_leds ?? 51);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!ipc.inTauri) return;
    let cancelled = false;
    Promise.all([ipc.listPorts(), ipc.listModels()])
      .then(([p, m]) => {
        if (cancelled) return;
        setPorts(p);
        setModels(m);
        if (!selectedPort) {
          const ch340 = p.find((x) => x.is_ch340);
          if (ch340) setSelectedPort(ch340.name);
          else if (p.length > 0) setSelectedPort(p[0].name);
        }
      })
      .catch((e) => setErr(String(e)));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentModelInfo = models.find((m) => m.id === selectedModel);
  const effectiveLeds = currentModelInfo?.n_leds ?? customLeds;

  const onConnect = async () => {
    if (!ipc.inTauri) {
      setErr("Not in Tauri runtime");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const next = await ipc.connect(
        selectedPort || null,
        effectiveLeds,
        currentModelInfo ? selectedModel : null
      );
      onState(next);
      onClose();
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  };

  const onDisconnect = async () => {
    if (!ipc.inTauri) return;
    setBusy(true);
    try {
      const next = await ipc.disconnect();
      onState(next);
    } finally {
      setBusy(false);
    }
  };

  const labelCss: React.CSSProperties = {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: t.fgMuted,
    textTransform: "uppercase",
    marginBottom: 6,
    display: "block",
  };

  const fieldCss: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "8px 10px",
    borderRadius: 8,
    background: t.inset,
    boxShadow: t.insetShadow,
    color: t.fg,
    fontFamily: FONTS.body,
    fontSize: 12,
    border: `1px solid ${t.border}`,
    appearance: "none",
    outline: "none",
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: t.bg,
        zIndex: 5,
        padding: "14px 18px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        overflow: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={onClose}
          aria-label="Back"
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            border: `1px solid ${t.borderStrong}`,
            color: t.fg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transform: "rotate(90deg)",
          }}
        >
          <Icon name="chevron" size={12} />
        </button>
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: 18,
            fontWeight: 500,
            letterSpacing: -0.3,
          }}
        >
          Connection
        </div>
        <div style={{ flex: 1 }} />
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            background: state.connected ? "#3AC8B0" : t.fgDim,
            boxShadow: state.connected ? "0 0 6px #3AC8B0" : "none",
          }}
        />
        <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: t.fgMuted }}>
          {state.connected ? "connected" : "offline"}
        </span>
      </div>

      <div>
        <label style={labelCss}>Serial port</label>
        <select
          value={selectedPort}
          onChange={(e) => setSelectedPort(e.target.value)}
          style={fieldCss}
        >
          <option value="">Auto-detect (CH340)</option>
          {ports.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
              {p.is_ch340 ? "  ·  CH340" : ""}
            </option>
          ))}
        </select>
        {ports.length === 0 && (
          <div
            style={{
              marginTop: 6,
              fontFamily: FONTS.mono,
              fontSize: 10,
              color: t.fgMuted,
            }}
          >
            No serial devices found. Plug in a SkyDimo, then press Refresh.
          </div>
        )}
      </div>

      <div>
        <label style={labelCss}>Model</label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          style={fieldCss}
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.id} · {m.n_leds} LEDs
            </option>
          ))}
          <option value="custom">Custom…</option>
        </select>
      </div>

      {selectedModel === "custom" && (
        <div>
          <label style={labelCss}>LED count</label>
          <input
            type="number"
            min={1}
            max={500}
            value={customLeds}
            onChange={(e) => setCustomLeds(Math.max(1, Number(e.target.value) || 1))}
            style={fieldCss}
          />
        </div>
      )}

      {currentModelInfo && (
        <div
          style={{
            padding: "8px 10px",
            borderRadius: 8,
            background: t.chip,
            border: `1px solid ${t.border}`,
            fontFamily: FONTS.mono,
            fontSize: 11,
            color: t.fgMuted,
            lineHeight: 1.5,
          }}
        >
          <div style={{ color: t.fg }}>{currentModelInfo.id}</div>
          <div>
            {currentModelInfo.n_leds} LEDs · segments [
            {currentModelInfo.lines.join(", ")}]
          </div>
        </div>
      )}

      {err && (
        <div
          style={{
            padding: "8px 10px",
            borderRadius: 8,
            background: "rgba(255,90,80,0.12)",
            color: "#FF7A6B",
            fontFamily: FONTS.mono,
            fontSize: 11,
            lineHeight: 1.5,
          }}
        >
          {err}
        </div>
      )}

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", gap: 8 }}>
        {state.connected ? (
          <button
            onClick={onDisconnect}
            disabled={busy}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 10,
              background: t.inset,
              boxShadow: t.insetShadow,
              color: t.fg,
              fontFamily: FONTS.body,
              fontSize: 12,
              fontWeight: 500,
              cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.6 : 1,
            }}
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={onConnect}
            disabled={busy}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 10,
              background: t.fg,
              color: t.bg,
              fontFamily: FONTS.body,
              fontSize: 12,
              fontWeight: 600,
              cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.6 : 1,
              boxShadow: t.raisedShadow,
            }}
          >
            {busy ? "Connecting…" : "Connect"}
          </button>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          onClick={() => ipc.quit().catch(() => {})}
          style={{
            fontFamily: FONTS.mono,
            fontSize: 10,
            color: t.fgDim,
            cursor: "pointer",
          }}
        >
          Quit SkyDimo
        </button>
      </div>
    </div>
  );
}
