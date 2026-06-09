import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17201c",
        clay: "#9d5133",
        safety: "#f2b705",
        field: "#1f6f5b",
        steel: "#53616c"
      },
      boxShadow: {
        soft: "0 12px 35px rgba(23, 32, 28, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
