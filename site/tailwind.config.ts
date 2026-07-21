import type { Config } from "tailwindcss";

// Preflight désactivé : on conserve le reset et le look du CSS porté
// (globals.css) au pixel près, tout en gardant les utilitaires Tailwind.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        creme: "#fbf5ec",
        "creme-2": "#f5ead9",
        terracotta: "#d98f63",
        "terracotta-f": "#b96c44",
        vert: "#7fa98d",
        "vert-f": "#5f8a70",
        encre: "#4a3a30",
        "encre-doux": "#6f5d51",
        ligne: "#ecdfce",
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        body: ['"Nunito"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
