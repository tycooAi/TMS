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
      fontSize: {
        xs: ['14px', { lineHeight: '20px' }],
        sm: ['16px', { lineHeight: '24px' }],
        base: ['18px', { lineHeight: '28px' }],
        lg: ['20px', { lineHeight: '28px' }],
        xl: ['22px', { lineHeight: '30px' }],
        '2xl': ['26px', { lineHeight: '34px' }],
        '3xl': ['32px', { lineHeight: '40px' }],
      },
    },
  },
  plugins: [],
};
