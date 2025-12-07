/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#89273B', // Your Brand Maroon
        secondary: '#FDF0F3', // Light Pink Background
        'text-dark': '#1A1A1A',
        'text-gray': '#666666',
        'status-green': '#E6F7E9',
        'status-green-text': '#2D8A39',
        'status-yellow': '#FFF8E1',
        'status-yellow-text': '#FBC02D',
        'status-blue': '#E3F2FD',
        'status-blue-text': '#1565C0',
      }
    },
  },
  plugins: [],
}