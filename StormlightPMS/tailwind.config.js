/** @type {import('tailwindcss').Config} */
// Token rule (DESIGN_SYSTEM_INTEGRATION_PLAN.md, Workstream A): every value below
// references a CSS variable from src/styles/tokens.css via var(). ZERO literal
// values live here — tokens.css is the single source of truth. These are ADDITIVE:
// Tailwind's default `slate`/`white`/`black` palettes are left intact so existing
// utilities (incl. opacity modifiers like `bg-slate-900/50`) keep working. Do NOT
// use opacity modifiers (e.g. `bg-brand/50`) on these token colors — bare var()
// breaks Tailwind's alpha syntax.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)'],
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        brand: {
          DEFAULT: 'var(--brand)',
          hover: 'var(--brand-hover)',
          active: 'var(--brand-active)',
          subtle: 'var(--brand-subtle)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          strong: 'var(--accent-strong)',
          fg: 'var(--accent-fg)',
          subtle: 'var(--accent-subtle)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          subtle: 'var(--secondary-subtle)',
        },
        navy: {
          50: 'var(--navy-50)',
          100: 'var(--navy-100)',
          200: 'var(--navy-200)',
          300: 'var(--navy-300)',
          400: 'var(--navy-400)',
          500: 'var(--navy-500)',
          600: 'var(--navy-600)',
          700: 'var(--navy-700)',
          800: 'var(--navy-800)',
          900: 'var(--navy-900)',
        },
        teal: {
          50: 'var(--teal-50)',
          100: 'var(--teal-100)',
          200: 'var(--teal-200)',
          300: 'var(--teal-300)',
          400: 'var(--teal-400)',
          500: 'var(--teal-500)',
          600: 'var(--teal-600)',
          700: 'var(--teal-700)',
          800: 'var(--teal-800)',
          900: 'var(--teal-900)',
        },
        gold: {
          50: 'var(--gold-50)',
          100: 'var(--gold-100)',
          200: 'var(--gold-200)',
          300: 'var(--gold-300)',
          400: 'var(--gold-400)',
          500: 'var(--gold-500)',
          600: 'var(--gold-600)',
          700: 'var(--gold-700)',
        },
        success: {
          DEFAULT: 'var(--success-500)',
          50: 'var(--success-50)',
          100: 'var(--success-100)',
          600: 'var(--success-600)',
          700: 'var(--success-700)',
          bg: 'var(--status-success-bg)',
          fg: 'var(--status-success-fg)',
        },
        warning: {
          DEFAULT: 'var(--warning-500)',
          50: 'var(--warning-50)',
          100: 'var(--warning-100)',
          600: 'var(--warning-600)',
          700: 'var(--warning-700)',
          bg: 'var(--status-warning-bg)',
          fg: 'var(--status-warning-fg)',
        },
        danger: {
          DEFAULT: 'var(--danger-500)',
          50: 'var(--danger-50)',
          100: 'var(--danger-100)',
          600: 'var(--danger-600)',
          700: 'var(--danger-700)',
          bg: 'var(--status-danger-bg)',
          fg: 'var(--status-danger-fg)',
        },
        info: {
          DEFAULT: 'var(--status-info)',
          bg: 'var(--status-info-bg)',
          fg: 'var(--status-info-fg)',
        },
      },
      backgroundColor: {
        app: 'var(--bg-app)',
        surface: 'var(--bg-surface)',
        subtle: 'var(--bg-subtle)',
        muted: 'var(--bg-muted)',
        inverse: 'var(--bg-inverse)',
        'inverse-2': 'var(--bg-inverse-2)',
      },
      textColor: {
        'fg-1': 'var(--fg-1)',
        'fg-2': 'var(--fg-2)',
        'fg-3': 'var(--fg-3)',
        'fg-link': 'var(--fg-link)',
        'on-brand': 'var(--fg-on-brand)',
        'on-dark': 'var(--fg-on-dark)',
        'on-dark-2': 'var(--fg-on-dark-2)',
      },
      borderColor: {
        DEFAULT: 'var(--border)',
        subtle: 'var(--border-subtle)',
        strong: 'var(--border-strong)',
        focus: 'var(--border-focus)',
        inverse: 'var(--border-inverse)',
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        focus: 'var(--shadow-focus)',
        'focus-danger': 'var(--shadow-focus-danger)',
      },
      // Additive named display sizes only — core text-xs/sm/base/lg keep Tailwind
      // defaults (with their paired line-heights) to avoid regressing existing text.
      // Use the .t-* classes from tokens.css for exact-fidelity headings/body.
      fontSize: {
        '2xs': 'var(--text-2xs)',
        h4: 'var(--text-h4)',
        h3: 'var(--text-h3)',
        h2: 'var(--text-h2)',
        h1: 'var(--text-h1)',
        display: 'var(--text-display)',
      },
    },
  },
  plugins: [],
};
