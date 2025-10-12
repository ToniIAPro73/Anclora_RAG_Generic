import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        anclora: {
          primary: "#D946EF",
          secondary: "#06B6D4",
          dark: "#111827",
          light: "#F8F9FA",
        },
      },
      backgroundImage: {
        "gradient-anclora": "linear-gradient(135deg, #D946EF 0%, #06B6D4 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
