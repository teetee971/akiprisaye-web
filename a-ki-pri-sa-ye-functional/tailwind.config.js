/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {"500":"#00a2ff"}
      },
      fontFamily: { sans: ["Inter","system-ui","Arial","sans-serif"]},
      boxShadow: { soft: "0 10px 30px rgba(0,0,0,0.35)" }
    },
  },
  plugins: [],
}