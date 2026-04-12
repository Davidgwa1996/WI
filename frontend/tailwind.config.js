/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
        },
        accent: {
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
        },
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
        info: "#3b82f6",

        dark: {
          bg: "#0a0a0f",
          panel: "#111827",
          card: "#1e293b",
          border: "#243041",
          text: "#f8fafc",
          muted: "#94a3b8",
          hover: "#1e293b",
        },

        app: {
          bg: "#f5f7fb",
          panel: "#ffffff",
          card: "#ffffff",
          border: "#e5e7eb",
          text: "#0f172a",
          muted: "#64748b",
          hover: "#f8fafc",
        },

        conviction: {
          high: "#10b981",
          medium: "#06b6d4",
          low: "#f59e0b",
          critical: "#ef4444",
        },
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },

      fontSize: {
        xxs: ["0.625rem", "0.75rem"],
        "2.5xl": ["1.75rem", "2.25rem"],
      },

      borderRadius: {
        xl2: "1rem",
        xl3: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },

      boxShadow: {
        glow: "0 0 0 1px rgba(34,211,238,0.15), 0 8px 30px rgba(6,182,212,0.18)",
        card: "0 8px 30px rgba(0,0,0,0.3)",
        "card-hover": "0 20px 35px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,211,238,0.1)",
        "glow-cyan": "0 0 20px rgba(6,182,212,0.3)",
        "glow-emerald": "0 0 20px rgba(16,185,129,0.3)",
        inner: "inset 0 2px 4px 0 rgba(0,0,0,0.05)",
        "app-card": "0 8px 24px rgba(15, 23, 42, 0.08)",
        "app-card-hover": "0 14px 34px rgba(15, 23, 42, 0.12)",
      },

      backgroundImage: {
        "hero-pattern":
          "radial-gradient(circle at 20% 20%, rgba(6,182,212,0.15), transparent 50%), linear-gradient(135deg, #0a0a0f 0%, #0f172a 100%)",
        "glass-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
        "landing-gradient":
          "radial-gradient(circle at top left, rgba(6,182,212,0.16), transparent 30%), radial-gradient(circle at top right, rgba(45,212,191,0.12), transparent 28%), linear-gradient(180deg, #0a0a0f 0%, #0f172a 100%)",
      },

      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "20px",
      },

      animation: {
        float: "float 3s ease-in-out infinite",
        "fade-in-up": "fadeInUp 0.5s ease-out forwards",
        "fade-in-down": "fadeInDown 0.5s ease-out forwards",
        "slide-in": "slideIn 0.3s ease-out forwards",
        "slide-in-right": "slideInRight 0.3s ease-out forwards",
        gradient: "gradient 15s ease infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 3s linear infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        shimmer: "shimmer 1.5s infinite",
        bounce: "bounce 1s ease-in-out infinite",
      },

      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          from: { opacity: "0", transform: "translateY(-20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        gradient: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 5px rgba(6, 182, 212, 0.2)" },
          "50%": { boxShadow: "0 0 20px rgba(6, 182, 212, 0.4)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },

      maxWidth: {
        "8xl": "90rem",
        "9xl": "120rem",
      },

      minHeight: {
        "screen-sm": "640px",
        "screen-md": "768px",
      },

      zIndex: {
        "-1": "-1",
        "1": "1",
        "10": "10",
        "20": "20",
        "30": "30",
        "40": "40",
        "50": "50",
      },

      transitionTimingFunction: {
        bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },

      transitionDuration: {
        "0": "0ms",
        "400": "400ms",
        "600": "600ms",
      },

      scale: {
        "102": "1.02",
        "105": "1.05",
      },

      opacity: {
        "1": "0.01",
        "2": "0.02",
        "3": "0.03",
        "4": "0.04",
        "5": "0.05",
        "95": "0.95",
        "98": "0.98",
      },
    },
  },

  plugins: [
    function ({ addUtilities, addComponents }) {
      addUtilities({
        ".line-clamp-1": {
          display: "-webkit-box",
          "-webkit-line-clamp": "1",
          "-webkit-box-orient": "vertical",
          overflow: "hidden",
        },
        ".line-clamp-2": {
          display: "-webkit-box",
          "-webkit-line-clamp": "2",
          "-webkit-box-orient": "vertical",
          overflow: "hidden",
        },
        ".line-clamp-3": {
          display: "-webkit-box",
          "-webkit-line-clamp": "3",
          "-webkit-box-orient": "vertical",
          overflow: "hidden",
        },
        ".no-scrollbar": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
        },
        ".no-scrollbar::-webkit-scrollbar": {
          display: "none",
        },
      });

      addComponents({
        ".landing-page": {
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top left, rgba(6,182,212,0.16), transparent 30%), radial-gradient(circle at top right, rgba(45,212,191,0.12), transparent 28%), linear-gradient(180deg, #0a0a0f 0%, #0f172a 100%)",
          color: "#f8fafc",
        },

        ".app-page": {
          minHeight: "100vh",
          background: "#f5f7fb",
          color: "#0f172a",
        },

        ".app-panel": {
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "1.5rem",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
        },

        ".app-panel-soft": {
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: "1.25rem",
        },

        ".glass-card": {
          background: "rgba(17, 24, 39, 0.8)",
          backdropFilter: "blur(12px)",
          borderRadius: "1.5rem",
          border: "1px solid rgba(6, 182, 212, 0.2)",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        },

        ".glass-card:hover": {
          transform: "translateY(-4px)",
          borderColor: "rgba(6, 182, 212, 0.4)",
          boxShadow:
            "0 20px 35px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(34,211,238,0.1)",
        },

        ".glass-card-dark": {
          background: "rgba(2, 6, 23, 0.95)",
          backdropFilter: "blur(12px)",
          borderRadius: "1.5rem",
          border: "1px solid rgba(51, 65, 85, 0.5)",
        },

        ".btn-primary": {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          borderRadius: "9999px",
          padding: "0.95rem 1.5rem",
          fontWeight: "700",
          color: "#ffffff",
          background: "linear-gradient(90deg, #06b6d4 0%, #14b8a6 100%)",
          boxShadow: "0 10px 24px rgba(6,182,212,0.25)",
          transition: "all 0.3s ease",
        },

        ".btn-primary:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 16px 30px rgba(6,182,212,0.35)",
        },

        ".btn-secondary": {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          borderRadius: "9999px",
          padding: "0.95rem 1.5rem",
          fontWeight: "700",
          color: "#f8fafc",
          background: "rgba(15, 23, 42, 0.25)",
          border: "1px solid rgba(148, 163, 184, 0.25)",
          backdropFilter: "blur(8px)",
          transition: "all 0.3s ease",
        },

        ".btn-secondary:hover": {
          borderColor: "rgba(34, 211, 238, 0.4)",
          background: "rgba(15, 23, 42, 0.4)",
        },

        ".btn-danger": {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          borderRadius: "0.9rem",
          padding: "0.85rem 1.2rem",
          fontWeight: "700",
          color: "#ffffff",
          background: "#dc2626",
          transition: "all 0.25s ease",
        },

        ".btn-danger:hover": {
          background: "#b91c1c",
        },

        ".live-dot": {
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
        },

        ".live-dot::before": {
          content: '""',
          width: "8px",
          height: "8px",
          backgroundColor: "#10b981",
          borderRadius: "50%",
          display: "inline-block",
          animation: "pulse 1.5s ease-in-out infinite",
        },

        ".score-high": {
          background: "rgba(16, 185, 129, 0.1)",
          color: "#10b981",
          border: "1px solid rgba(16, 185, 129, 0.2)",
          borderRadius: "12px",
          padding: "4px 12px",
          fontSize: "12px",
          fontWeight: "500",
        },

        ".score-medium": {
          background: "rgba(6, 182, 212, 0.1)",
          color: "#06b6d4",
          border: "1px solid rgba(6, 182, 212, 0.2)",
          borderRadius: "12px",
          padding: "4px 12px",
          fontSize: "12px",
          fontWeight: "500",
        },

        ".score-low": {
          background: "rgba(245, 158, 11, 0.1)",
          color: "#f59e0b",
          border: "1px solid rgba(245, 158, 11, 0.2)",
          borderRadius: "12px",
          padding: "4px 12px",
          fontSize: "12px",
          fontWeight: "500",
        },

        ".score-critical": {
          background: "rgba(239, 68, 68, 0.1)",
          color: "#ef4444",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          borderRadius: "12px",
          padding: "4px 12px",
          fontSize: "12px",
          fontWeight: "500",
        },
      });
    },
  ],
};