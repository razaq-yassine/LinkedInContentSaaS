module.exports = {
  apps: [
    {
      name: "postinai-frontend",
      script: "npm",
      args: "start -- -p 3007",
      cwd: "/home/LinkedInContentSaaS/frontend",
      env: {
        NODE_ENV: "production",
        PORT: 3007,
        NEXT_PUBLIC_API_URL: "https://postinai.smarttechnologies.ma"
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      time: true
    },
    {
      name: "postinai-backend",
      script: "/home/LinkedInContentSaaS/backend/venv/bin/python",
      args: "-m uvicorn app.main:app --host 0.0.0.0 --port 8003",
      cwd: "/home/LinkedInContentSaaS/backend",
      env: {
        ENVIRONMENT: "production",
        PORT: 8003,
        PYTHONPATH: "/home/LinkedInContentSaaS/backend",
        PATH: "/home/LinkedInContentSaaS/backend/venv/bin:/usr/local/bin:/usr/bin:/bin"
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      time: true,
      interpreter: "none"
    }
  ]
};
