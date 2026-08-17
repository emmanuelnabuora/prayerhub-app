/** @type {import('next').NextConfig} */
module.exports = {
  // Cloud Run wants a self-contained server bundle rather than requiring
  // `next start` + the full node_modules tree in the runtime image — see
  // apps/web-admin/Dockerfile, which copies only .next/standalone.
  output: 'standalone',
};
