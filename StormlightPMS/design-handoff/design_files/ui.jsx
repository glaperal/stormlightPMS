/* StormlightPMS UI kit — shared primitives. Exposes components on window. */

function Icon({ name, size = 18, stroke = 1.75, color, style, className }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (el && window.lucide) {
      el.innerHTML = "";
      const i = document.createElement("i");
      i.setAttribute("data-lucide", name);
      el.appendChild(i);
      window.lucide.createIcons({ attrs: { "stroke-width": stroke, width: size, height: size } });
    }
  }, [name, size, stroke]);
  return (
    <span
      ref={ref}
      className={className}
      style={{ display: "inline-flex", alignItems: "center", color, lineHeight: 0, ...style }}
    />
  );
}

function Logo({ size = 36, showWord = true, light = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <img src="assets/logo-mark.svg" width={size} height={size} alt="StormlightPMS" />
      {showWord && (
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: size * 0.62,
            letterSpacing: "-0.02em",
            color: light ? "#fff" : "var(--navy-500)",
          }}
        >
          Stormlight
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: size * 0.3,
              letterSpacing: "0.07em",
              marginLeft: 6,
              verticalAlign: size * 0.07,
              color: light ? "var(--gold-400)" : "var(--teal-600)",
            }}
          >
            PMS
          </span>
        </div>
      )}
    </div>
  );
}

function Btn({ children, kind = "primary", size = "md", icon, iconRight, onClick, full, type = "button", title, disabled }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    fontFamily: "var(--font-sans)",
    fontWeight: 600,
    borderRadius: "var(--radius-md)",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "transparent",
    cursor: "pointer",
    lineHeight: 1,
    whiteSpace: "nowrap",
    transition: "background .15s ease, box-shadow .15s ease, border-color .15s ease",
    width: full ? "100%" : undefined,
  };
  const sizes = {
    sm: { padding: "7px 12px", fontSize: 13 },
    md: { padding: "9px 16px", fontSize: 14 },
    lg: { padding: "12px 20px", fontSize: 15 },
  };
  const kinds = {
    primary: { background: "var(--brand)", color: "#fff" },
    accent: { background: "var(--accent)", color: "var(--accent-fg)" },
    secondary: { background: "var(--bg-surface)", color: "var(--fg-1)", borderColor: "var(--border-strong)" },
    ghost: { background: "transparent", color: "var(--fg-2)" },
    danger: { background: "var(--bg-surface)", color: "var(--danger-600)", borderColor: "var(--danger-100)" },
  };
  const [hover, setHover] = React.useState(false);
  const hoverStyle = hover
    ? {
        primary: { background: "var(--brand-hover)" },
        accent: { background: "var(--accent-hover)" },
        secondary: { background: "var(--bg-muted)" },
        ghost: { background: "var(--bg-muted)", color: "var(--fg-1)" },
        danger: { background: "var(--danger-50)" },
      }[kind]
    : {};
  const ic = size === "sm" ? 15 : 16;
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => !disabled && setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...base, ...sizes[size], ...kinds[kind], ...(disabled ? { background: "var(--bg-muted)", color: "var(--fg-3)", borderColor: "transparent", cursor: "not-allowed" } : hoverStyle) }}
    >
      {icon && <Icon name={icon} size={ic} />}
      {children}
      {iconRight && <Icon name={iconRight} size={ic} />}
    </button>
  );
}

const STATUS = {
  paid: { bg: "var(--status-success-bg)", fg: "var(--status-success-fg)", dot: "var(--success-500)", label: "Paid" },
  due: { bg: "var(--status-warning-bg)", fg: "var(--status-warning-fg)", dot: "var(--warning-500)", label: "Due 01 Apr" },
  overdue: { bg: "var(--status-danger-bg)", fg: "var(--status-danger-fg)", dot: "var(--danger-500)", label: "Overdue" },
  partial: { bg: "var(--status-info-bg)", fg: "var(--status-info-fg)", dot: "var(--teal-600)", label: "Partial" },
  occupied: { bg: "var(--navy-50)", fg: "var(--navy-600)", dot: "var(--navy-500)", label: "Occupied" },
  vacant: { bg: "var(--bg-muted)", fg: "var(--fg-2)", dot: "var(--slate-400)", label: "Vacant" },
};

function Pill({ status, children, dot = true }) {
  const s = STATUS[status] || STATUS.due;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: "var(--radius-full)",
        fontSize: 12,
        fontWeight: 600,
        background: s.bg,
        color: s.fg,
        whiteSpace: "nowrap",
      }}
    >
      {dot && <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot }} />}
      {children || s.label}
    </span>
  );
}

function Tag({ children, tone = "muted" }) {
  const tones = {
    muted: { background: "var(--bg-muted)", color: "var(--fg-2)" },
    gold: { background: "var(--gold-100)", color: "var(--gold-700)" },
    teal: { background: "var(--teal-50)", color: "var(--teal-800)" },
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 9px",
        borderRadius: "var(--radius-sm)",
        fontSize: 12,
        fontWeight: 500,
        ...tones[tone],
      }}
    >
      {children}
    </span>
  );
}

const AV_COLORS = ["var(--navy-500)", "var(--teal-500)", "var(--gold-500)", "var(--slate-500)", "var(--teal-700)", "var(--navy-400)"];
function Avatar({ initials, size = 34, seed = 0 }) {
  const bg = AV_COLORS[(initials ? initials.charCodeAt(0) + seed : seed) % AV_COLORS.length];
  return (
    <span
      style={{
        width: size,
        height: size,
        flex: "0 0 auto",
        borderRadius: "50%",
        background: bg,
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.38,
      }}
    >
      {initials}
    </span>
  );
}

function Card({ children, style, pad = 20, className }) {
  return (
    <div
      className={className}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        padding: pad,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function StatCard({ icon, iconBg, iconColor, label, value, trend, trendKind = "up" }) {
  const tk = {
    up: { bg: "var(--success-50)", fg: "var(--success-700)", ic: "trending-up" },
    flat: { bg: "var(--bg-muted)", fg: "var(--fg-2)", ic: "minus" },
    gold: { bg: "var(--gold-100)", fg: "var(--gold-700)", ic: "zap" },
  }[trendKind];
  return (
    <Card pad={18}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "var(--radius-md)",
          background: iconBg,
          color: iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <Icon name={icon} size={18} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--fg-3)" }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          fontSize: 26,
          color: "var(--fg-1)",
          marginTop: 5,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      {trend && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            marginTop: 9,
            fontSize: 12,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: "var(--radius-full)",
            background: tk.bg,
            color: tk.fg,
          }}
        >
          <Icon name={tk.ic} size={13} />
          {trend}
        </span>
      )}
    </Card>
  );
}

function Field({ label, children, hint, error }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-1)" }}>{label}</span>}
      {children}
      {error ? (
        <span style={{ fontSize: 11, color: "var(--danger-600)", fontWeight: 500 }}>{error}</span>
      ) : hint ? (
        <span style={{ fontSize: 11, color: "var(--fg-3)" }}>{hint}</span>
      ) : null}
    </label>
  );
}

function Input({ value, onChange, placeholder, prefix, icon, type = "text", error, autoFocus }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "var(--bg-surface)",
        border: "1px solid " + (error ? "var(--danger-500)" : focus ? "var(--border-focus)" : "var(--border-strong)"),
        borderRadius: "var(--radius-md)",
        padding: "9px 12px",
        boxShadow: error ? "var(--shadow-focus-danger)" : focus ? "var(--shadow-focus)" : "none",
        transition: "box-shadow .15s, border-color .15s",
      }}
    >
      {icon && <Icon name={icon} size={16} color="var(--fg-3)" />}
      {prefix && <span style={{ color: "var(--fg-2)", fontSize: 14 }}>{prefix}</span>}
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange && onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholder={placeholder}
        style={{
          border: 0,
          outline: 0,
          background: "transparent",
          flex: 1,
          minWidth: 0,
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          color: "var(--fg-1)",
        }}
      />
    </span>
  );
}

function Select({ value, onChange, options, placeholder }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        background: "var(--bg-surface)",
        border: "1px solid " + (focus ? "var(--border-focus)" : "var(--border-strong)"),
        borderRadius: "var(--radius-md)",
        padding: "0 12px",
        boxShadow: focus ? "var(--shadow-focus)" : "none",
        transition: "box-shadow .15s, border-color .15s",
        position: "relative",
      }}
    >
      <select
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          border: 0,
          outline: 0,
          background: "transparent",
          flex: 1,
          padding: "9px 0",
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          color: value ? "var(--fg-1)" : "var(--fg-3)",
          cursor: "pointer",
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const val = typeof o === "string" ? o : o.value;
          const label = typeof o === "string" ? o : o.label;
          return <option key={val} value={val}>{label}</option>;
        })}
      </select>
      <Icon name="chevron-down" size={16} color="var(--fg-3)" style={{ pointerEvents: "none" }} />
    </span>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange && onChange(!on)}
      style={{
        width: 40,
        height: 23,
        borderRadius: 999,
        border: 0,
        cursor: "pointer",
        padding: 2,
        background: on ? "var(--gold-400)" : "var(--slate-300)",
        transition: "background .16s",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      <span
        style={{
          width: 19,
          height: 19,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "var(--shadow-xs)",
          transform: on ? "translateX(17px)" : "translateX(0)",
          transition: "transform .16s cubic-bezier(0.2,0,0,1)",
        }}
      />
    </button>
  );
}

function Segmented({ value, onChange, options, cols }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols || options.length}, 1fr)`, gap: 8 }}>
      {options.map((o) => {
        const val = typeof o === "string" ? o : o.value;
        const label = typeof o === "string" ? o : o.label;
        const on = value === val;
        return (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            style={{
              padding: "9px 10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid " + (on ? "var(--gold-500)" : "var(--border-strong)"),
              background: on ? "var(--gold-50)" : "var(--bg-surface)",
              color: on ? "var(--gold-700)" : "var(--fg-2)",
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              fontSize: 13,
              lineHeight: 1.25,
              textAlign: "center",
              cursor: "pointer",
              boxShadow: on ? "var(--shadow-focus)" : "none",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function Modal({ title, onClose, children, footer, width = 460 }) {
  return (
    <div
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6,31,56,0.45)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        animation: "storm-fade .15s ease",
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width,
          maxWidth: "92vw",
          background: "var(--bg-surface)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-xl)",
          animation: "storm-pop .18s cubic-bezier(0.2,0,0,1)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 22px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 17, color: "var(--fg-1)" }}>{title}</div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--fg-3)", display: "flex", padding: 4 }}
          >
            <Icon name="x" size={20} />
          </button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
        {footer && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 22px", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-subtle)" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--navy-800)",
        color: "#fff",
        padding: "12px 18px",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-lg)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 14,
        fontWeight: 500,
        zIndex: 200,
        animation: "storm-toast .25s cubic-bezier(0.2,0,0,1)",
      }}
    >
      <Icon name="circle-check" size={18} color="var(--gold-400)" />
      {toast}
    </div>
  );
}

function PageHead({ title, subtitle, actions }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22, gap: 16, flexWrap: "wrap" }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 30, lineHeight: 1.12, letterSpacing: "-0.02em", color: "var(--fg-1)" }}>
          {title}
        </h1>
        {subtitle && <p style={{ margin: "9px 0 0", fontSize: 14, color: "var(--fg-2)" }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: "flex", gap: 10 }}>{actions}</div>}
    </div>
  );
}

const TIMELINE_SEG = {
  rentFree: { bg: "repeating-linear-gradient(135deg, var(--gold-200), var(--gold-200) 7px, var(--gold-100) 7px, var(--gold-100) 14px)", fg: "var(--gold-800)", shadow: false },
  standard: { bg: "linear-gradient(180deg, var(--navy-400), var(--navy-600))", fg: "#fff", shadow: true },
  advance: { bg: "linear-gradient(180deg, var(--teal-400), var(--teal-600))", fg: "#fff", shadow: true },
};

// Presentational lease-term bar shared by the lease detail and add-lease wizard.
function TLLegend({ c, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 11, height: 11, borderRadius: 3, background: c }} />{label}
    </span>
  );
}

function TimelineBar({ schedule, startLabel, endLabel, height = 40, showLabels = true }) {
  const sch = schedule;
  return (
    <div>
      <div style={{ position: "relative", height, marginTop: 30, marginBottom: 10 }}>
        {sch.segments.map((s, i) => {
          const c = TIMELINE_SEG[s.kind];
          const w = s.toPct - s.fromPct;
          if (w <= 0.5) return null;
          return (
            <div key={i} title={s.label} style={{ position: "absolute", left: s.fromPct + "%", width: w + "%", top: 0, bottom: 0, background: c.bg, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.35)", borderRadius: s.fromPct <= 0.5 ? "7px 0 0 7px" : s.toPct >= 99.5 ? "0 7px 7px 0" : 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: c.fg, whiteSpace: "nowrap", padding: "0 6px", textShadow: c.shadow ? "0 1px 2px rgba(0,0,0,0.2)" : "none" }}>{w > 14 ? s.label : ""}</span>
            </div>
          );
        })}
        {sch.markers.map((m, i) => (
          <div key={i} style={{ position: "absolute", left: Math.min(m.pct, 99) + "%", top: -24, bottom: -5, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none", zIndex: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--gold-800)", background: "var(--gold-100)", border: "1px solid var(--gold-300)", padding: "1px 6px", borderRadius: "var(--radius-full)", whiteSpace: "nowrap" }}>{m.label}{m.atRenewal ? " renewal" : ""}</span>
            <div style={{ width: 2, flex: 1, background: "var(--gold-600)" }} />
          </div>
        ))}
        {sch.todayIn && (
          <div style={{ position: "absolute", left: sch.todayPct + "%", top: -8, bottom: -8, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none", zIndex: 3 }}>
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "var(--danger-500)", border: "2px solid var(--bg-surface)", boxShadow: "var(--shadow-sm)" }} />
            <div style={{ width: 2, flex: 1, background: "var(--danger-500)" }} />
          </div>
        )}
      </div>
      {showLabels && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "var(--fg-3)" }}>
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Icon, Logo, Btn, Pill, Tag, Avatar, Card, StatCard, Field, Input, Select, Toggle, Segmented, Modal, Toast, PageHead, TimelineBar, TLLegend, STATUS });
