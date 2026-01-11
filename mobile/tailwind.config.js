/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#F97316', // Orange
        secondary: '#7C3AED', // Purple
        dark: '#1E1E2D', // Dark Brand
        bgLight: '#F8F9FD',
      }
    },
  },
  plugins: [],
}
