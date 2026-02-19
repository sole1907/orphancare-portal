/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1a365d", // Navy Blue (from logo)
        "primary-light": "#667eea", // Purple/Indigo (from logo heart)
        accent: "#38b2ac", // Teal (from logo hand)
        "accent-warm": "#ecc94b", // Golden (from logo child)
        background: "#F5F5F5", // Soft Gray
        base: "#1a365d", // Navy
      },
    },
  },
  plugins: [],
};
