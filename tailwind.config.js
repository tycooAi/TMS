/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#16425B',
          primary: '#2F668F',
          secondary: '#3B7CA6',
          cyan: '#81C4D7',
          neutral: '#D9DBD6',
          canvas: '#F5F7FA',
        },
      },
      boxShadow: {
        panel: '0 1px 2px rgba(22, 66, 91, 0.05), 0 8px 24px rgba(22, 66, 91, 0.06)',
      },
    },
  },
  plugins: [],
};
