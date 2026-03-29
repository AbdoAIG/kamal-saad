#!/bin/bash
# Setup PgBouncer for production connection pooling
# This script helps configure the connection between Next.js and PgBouncer

set -e

echo "=== PgBouncer Setup for Kamal Saad E-commerce ==="
echo ""

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "Error: docker-compose is not installed"
    exit 1
fi

echo "Current DATABASE_URL:"
echo "$DATABASE_URL"
echo ""

echo "For production with PgBouncer, update your .env file:"
echo "  DATABASE_URL=postgresql://kamal:YOUR_PASSWORD@localhost:6432/kamal_saad?pgbouncer=true"
echo ""
echo "For Prisma with PgBouncer, add connection_limit to your schema:"
echo "  datasource db {"
echo "    provider  = \"postgresql\""
echo "    url       = env(\"DATABASE_URL\")"
echo "    directUrl = env(\"DIRECT_DATABASE_URL\")"
echo "  }"
echo ""

echo "PgBouncer defaults:"
echo "  - Max client connections: 1000"
echo "  - Default pool size: 20"
echo "  - Pool mode: transaction"
echo "  - Port: 6432"
echo ""

echo "To start: docker-compose up -d db pgbouncer"
echo "To check: docker-compose logs pgbouncer"
echo "To monitor: docker-compose exec pgbouncer psql -h localhost -p 6432 -U kamal -c 'SHOW POOLS;'"
