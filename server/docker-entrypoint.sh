#!/bin/sh
set -e

echo "Applying database migrations..."
npx prisma migrate deploy || echo "Migration skipped or already up to date."

echo "Seeding catalog and demo user..."
node prisma/seed.cjs

echo "Starting server..."
exec "$@"
