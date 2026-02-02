module.exports = {
  apps: [{
    name: "chest-overlay",
    cwd: "/Users/omistaja/hub/chest-overlay",
    script: "pnpm",
    args: "run dev",
    interpreter: "/opt/homebrew/bin/node",
    env: { NODE_ENV: "development", TZ: "Europe/Helsinki", PORT: "5173" },
    out_file: "logs/vite.out.log",
    error_file: "logs/vite.err.log",
    time: true,
    watch: false,
    max_restarts: 10,
    restart_delay: 2000
  }]
};
