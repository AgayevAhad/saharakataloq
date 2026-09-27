module.exports = {
  apps: [
    {
      name: 'ardo-kataloq',
      script: 'server.mjs',
      cwd: __dirname,
      node_args: '--env-file-if-exists=.env',
      env: {
        NODE_ENV: 'production',
        VITE_APP_MODE: 'catalog',
        APP_MODE: 'catalog',
      },
      max_memory_restart: '500M',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
