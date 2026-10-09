// Installed on the server at /var/www/orange/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "orange",
      cwd: "/var/www/orange/current",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3000",
      env: { NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1" },
      max_memory_restart: "700M",
      autorestart: true,
      kill_timeout: 5000,
    },
  ],
};
