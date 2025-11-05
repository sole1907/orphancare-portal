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
        primary: "#4FC3F7", // Sky Blue 600
        accent: "#FF9E80", // Coral Peach
        background: "#F5F5F5", // Soft Gray
        base: "#2C3E50", // Navy
      },
    },
  },
  plugins: [],
};
