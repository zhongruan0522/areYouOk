#!/bin/sh

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

ensure_permissions() {
    # 仅在以 root 运行时调整挂载目录权限，保证 nodejs 用户可读写
    if [ "$(id -u)" -eq 0 ]; then
        mkdir -p /app/data /app/logs
        chown -R nodejs:nodejs /app/data /app/logs || log "Warn: failed to chown /app/data or /app/logs"
    fi
}

wait_for_backend() {
    log "Waiting for backend..."
    for i in $(seq 1 5); do
        if curl -f -s http://localhost:7965/ > /dev/null 2>&1; then
            log "Backend ready"
            return 0
        fi
        sleep 1
    done
    log "Backend failed to start"
    return 1
}

init_database() {
    if [ ! -f "/app/data/expense_bills.db" ]; then
        log "Initializing database..."
        if [ "$(id -u)" -eq 0 ]; then
            cd /app/backend && su-exec nodejs npm run init-db 2>&1 | tee /app/logs/db_init.log
        else
            cd /app/backend && npm run init-db 2>&1 | tee /app/logs/db_init.log
        fi
        [ $? -eq 0 ] || { log "Database init failed"; exit 1; }
    fi
}

log "Starting AreYouOk..."

ensure_permissions

init_database

log "Starting backend..."
if [ "$(id -u)" -eq 0 ]; then
    cd /app/backend && su-exec nodejs sh -c 'NODE_ENV=production PORT=7965 npm start' > /app/logs/backend.log 2>&1 &
else
    cd /app/backend && NODE_ENV=production PORT=7965 npm start > /app/logs/backend.log 2>&1 &
fi
BACKEND_PID=$!

wait_for_backend

log "Starting nginx..."
if [ "$(id -u)" -eq 0 ]; then
    su-exec nodejs nginx -g 'daemon off; pid /run/nginx/nginx.pid;' \
      -c /etc/nginx/nginx.conf \
      -e error >/app/logs/nginx.log 2>&1 &
else
    nginx -g 'daemon off; pid /run/nginx/nginx.pid;' \
      -c /etc/nginx/nginx.conf \
      -e error >/app/logs/nginx.log 2>&1 &
fi
NGINX_PID=$!

shutdown() {
    log "Stopping services..."
    kill -TERM $NGINX_PID $BACKEND_PID 2>/dev/null
    wait $NGINX_PID $BACKEND_PID
    log "Stopped"
    exit 0
}

trap shutdown SIGTERM SIGINT

tail -f /app/logs/backend.log &

log "Services started"
log "Frontend: http://localhost:3000"
log "API: http://localhost:3000/api/"

wait $BACKEND_PID $NGINX_PID
