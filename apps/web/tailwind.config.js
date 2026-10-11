/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--accent-soft)',
          100: 'var(--accent-soft)',
          200: 'var(--accent-line)',
          300: 'rgb(var(--accent-rgb) / 0.4)',
          400: 'rgb(var(--accent-rgb) / 0.7)',
          500: 'rgb(var(--accent-rgb) / <alpha-value>)',
          600: 'rgb(var(--accent-rgb) / <alpha-value>)',
          700: 'var(--accent-hover)',
          800: 'var(--hero-ink)',
          900: 'var(--ink)',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
