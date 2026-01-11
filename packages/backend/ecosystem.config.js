// PM2 Ecosystem Configuration for Xphere Cloud Mining
// Server: trendy.storydot.kr - Port 4100 (unique for this service)

module.exports = {
  apps: [{
    name: 'xphere-cloudmining',  // Unique process name
    script: 'dist/main.js',
    instances: 1,  // Single instance to save resources
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 4100  // Unique port for this service
    },
    error_file: '/mnt/storage/cloudmining/logs/error.log',
    out_file: '/mnt/storage/cloudmining/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
