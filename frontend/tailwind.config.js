/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
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
          900: "#164e63"
        },
        accent: {
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488"
        },
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
        dashboard: {
          bg: "#020617",
          panel: "#0f172a",
          card: "#111827",
          border: "#1e293b",
          text: "#f8fafc",
          muted: "#94a3b8"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      borderRadius: {
        xl2: "1rem",
        xl3: "1.25rem"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(34,211,238,0.15), 0 8px 30px rgba(6,182,212,0.18)",
        card: "0 8px 30px rgba(2, 6, 23, 0.18)"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top, rgba(6,182,212,0.16), transparent 30%), linear-gradient(180deg, #020617 0%, #0f172a 100%)",
        "brand-gradient":
          "linear-gradient(135deg, #06b6d4 0%, #14b8a6 50%, #10b981 100%)"
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        "fade-in-up": "fadeInUp 0.5s ease-out forwards",
        gradient: "gradient 15s ease infinite"
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        gradient: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" }
        }
      },
      maxWidth: {
        "8xl": "90rem"
      }
    }
  },
  plugins: []
};