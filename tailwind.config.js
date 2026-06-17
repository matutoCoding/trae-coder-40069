/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: "#E8F3FF",
          100: "#B9D8FF",
          200: "#8AB9FF",
          300: "#5B9BFF",
          400: "#2C7CFF",
          500: "#165DFF",
          600: "#0E42CC",
          700: "#092E99",
          800: "#051A66",
          900: "#020D33",
        },
        industrial: {
          bg: "#0A0E1A",
          card: "#141A2E",
          border: "#1E2A45",
          text: "#E6E8EF",
          subtext: "#8A94A6",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        sans: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
      },
      boxShadow: {
        "glow-blue": "0 0 20px rgba(22, 93, 255, 0.3)",
        "glow-green": "0 0 20px rgba(0, 180, 42, 0.3)",
        "glow-orange": "0 0 20px rgba(255, 125, 0, 0.3)",
        "glow-red": "0 0 20px rgba(245, 63, 63, 0.3)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "breathing": "breathing 2s ease-in-out infinite",
      },
      keyframes: {
        breathing: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
    },
  },
  plugins: [],
};
