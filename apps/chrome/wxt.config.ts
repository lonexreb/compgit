import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: '.',
  manifest: {
    name: 'compgit',
    description: 'GitHub commits, quietly visible.',
    default_locale: 'en',
    permissions: ['storage', 'alarms', 'sidePanel'],
    host_permissions: ['https://api.github.com/*'],
    action: {
      default_title: 'compgit',
    },
    side_panel: {
      default_path: 'sidepanel.html',
    },
    options_ui: {
      page: 'options.html',
      open_in_tab: true,
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
