import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        panel: "#ffffff",
        line: "#d9e2ec",
        teal: "#0f766e",
        amber: "#b7791f",
        coral: "#b45353"
      },
      boxShadow: {
        soft: "0 1px 2px rgba(23, 32, 42, 0.06), 0 8px 24px rgba(23, 32, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
