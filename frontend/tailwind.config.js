/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // CBC brand palette — use as: bg-cbc-navy, text-cbc-gold, etc.
        cbc: {
          navy:  '#1B3A6B',
          gold:  '#E8C840',
          teal:  '#028090',
          green: '#02C39A',
        },
        // M-Pesa brand colour
        mpesa: {
          green: '#00A550',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Arial', 'sans-serif'],
        mono: ['"Courier New"', 'Courier', 'monospace'],
      },
      screens: {
        // Lab PC breakpoint — many Kenyan school labs use 1024×768 monitors
        'lab': '1024px',
      },
    },
  },
  plugins: [],
};
