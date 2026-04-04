import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ChapAI Design Tokens
        teal: {
          DEFAULT: "#2e7d8c",
          50:  "#f0f9fb",
          100: "#d9f0f4",
          200: "#b3e1e9",
          300: "#7ec8d5",
          400: "#45a9bc",
          500: "#2e7d8c",  // primary
          600: "#256470",
          700: "#1e5059",
          800: "#183f47",
          900: "#112e33",
        },
        terra: {
          DEFAULT: "#d97757",
          50:  "#fdf5f1",
          100: "#fae8df",
          200: "#f4cbb8",
          300: "#eca98b",
          400: "#e38c68",
          500: "#d97757",  // accent
          600: "#c45c3b",
          700: "#a3482d",
          800: "#7f3821",
          900: "#5a2716",
        },
        sage: {
          DEFAULT: "#5a8a5e",
          500: "#5a8a5e",
        },
        background: "#f8f7f3",
        surface:    "#ffffff",
        dark:       "#1a1f2e",
        muted:      "#6b7280",
        border:     "#e5e3dc",
        // Semantic
        success:    "#5a8a5e",
        error:      "#c74b3f",
        warning:    "#d97757",
        info:       "#2e7d8c",
      },
      fontFamily: {
        sans:  ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        mono:  ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "12px",
        sm:  "8px",
        md:  "12px",
        lg:  "16px",
        xl:  "20px",
        "2xl": "24px",
        full: "9999px",
      },
      boxShadow: {
        card:  "0 2px 12px 0 rgba(26,31,46,0.06)",
        hover: "0 4px 20px 0 rgba(26,31,46,0.10)",
        modal: "0 20px 60px 0 rgba(26,31,46,0.15)",
      },
      animation: {
        "fade-in":    "fadeIn 0.3s ease-out",
        "slide-up":   "slideUp 0.4s cubic-bezier(0.16,1,0.3,1)",
        "slide-right":"slideRight 0.4s cubic-bezier(0.16,1,0.3,1)",
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideRight: {
          "0%":   { opacity: "0", transform: "translateX(32px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
