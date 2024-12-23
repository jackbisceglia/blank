import api from './api';

export default new sst.aws.SolidStart('WEB', {
  path: 'packages/web',
  environment: {
    VITE_PUBLIC_SERVER: process.env.VITE_PUBLIC_SERVER ?? '',
    VITE_API_URL: api.url,
    VITE_CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY ?? '',
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ?? '',
  },
});
