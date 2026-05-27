/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  // Disable webpack cache due to # character issue in path
  webpack: (config) => {
    config.cache = false;
    return config;
  },
}

module.exports = nextConfig
