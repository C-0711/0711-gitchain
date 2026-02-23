/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#fafaf9',
        surface: '#ffffff',
        sunken: '#f4f4f2',
        foreground: '#1a1a1a',
        muted: '#6b6b6b',
        subtle: '#9a9a9a',
        border: '#e5e5e3',
        'border-strong': '#d1d1cf',
        accent: {
          DEFAULT: '#c45a1e',
          hover: '#a84c18',
          subtle: '#fef3ed',
        },
        success: {
          DEFAULT: '#1a7f37',
          subtle: '#dafbe1',
        },
        warning: {
          DEFAULT: '#9a6700',
          subtle: '#fff8c5',
        },
        error: {
          DEFAULT: '#cf222e',
          subtle: '#ffebe9',
        },
        info: {
          DEFAULT: '#0969da',
          subtle: '#ddf4ff',
        },
        verified: {
          DEFAULT: '#8250df',
          subtle: '#fbefff',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Noto Sans', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
