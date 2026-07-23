import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Agriculture green anchor + clean neutrals (industrial-but-modern B2B).
        brand: {
          50: '#f0f7f1',
          100: '#dcecdd',
          200: '#bcd9bf',
          300: '#8fbe95',
          400: '#5f9e68',
          500: '#3f8248',
          600: '#2f6837',
          700: '#27532e',
          800: '#224327',
          900: '#1d3822',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
