import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "casino-black": "#0A0A0A",
        "casino-black-lighter": "#141414",
        "casino-gray-darker": "#1A1A1A",
        "casino-gray-dark": "#252525",
        "casino-gray": "#525252",
        "casino-gray-light": "#A3A3A3",
        "casino-white": "#FAFAFA",
        "casino-accent-primary": "#DC2626",
        "casino-accent-secondary": "#16A34A",
        "casino-accent-gold": "#D4AF37",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "slot-spin-quick": "slotSpin 0.4s linear infinite",
        "slot-spin-slow": "slotSpin 0.9s linear infinite",
        "multiplier-shake": "multiplierShake 0.4s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        slotSpin: {
          "0%": { transform: "translateY(-25%)" },
          "100%": { transform: "translateY(25%)" },
        },
        multiplierShake: {
          "0%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "50%": { transform: "translateX(4px)" },
          "75%": { transform: "translateX(-2px)" },
          "100%": { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

