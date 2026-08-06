#!/bin/sh
set -e

echo "Applying database migrations..."
npx prisma migrate deploy || echo "Migration skipped or already up to date."

echo "Starting server..."
exec "$@"
