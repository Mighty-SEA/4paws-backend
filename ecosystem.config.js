module.exports = {
  apps: [
    {
      name: "4paws-backend",
      cwd: __dirname,
      script: "dist/src/main.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      autorestart: true,
      max_memory_restart: "300M",
      env_file: ".env.production",
      env: { NODE_ENV: "production" }
    }
  ]
};


