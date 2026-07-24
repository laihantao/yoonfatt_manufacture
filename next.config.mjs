import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hide the dev-only on-screen indicator (the "N" button). It never
  // appears in production anyway.
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  images: {
    remotePatterns: [
      // Supabase Storage public URLs — host filled in once you set your project ref.
      { protocol: 'https', hostname: '*.supabase.co' },
      // Allow placeholder/remote seed images during local preview.
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
};

export default withNextIntl(nextConfig);
