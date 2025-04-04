#!/bin/bash

# Pull the latest PostgreSQL image
echo "Pulling PostgreSQL Docker image..."
docker pull postgres:latest

# Load environment variables
export $(cat .env | grep -v '#' | sed 's/\r$//' | xargs)

variables=("DB_USER" "DB_PASS" "DB_NAME" "DB_PORT" "DB_HOST")

for i in "${!variables[@]}"; do
    var=${variables[$i]}
    if [ -z "${!var}" ]; then
        echo "Error: ${var} is not set."
        exit 1
    fi
done

# Run PostgreSQL container with environment variables
echo "Starting PostgreSQL container..."
docker run --name postgres_container \
  -e POSTGRES_USER=${DB_USER} \
  -e POSTGRES_PASSWORD=${DB_PASS} \
  -e POSTGRES_DB=${DB_NAME} \
  -p ${DB_PORT}:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  -d postgres:latest

echo "PostgreSQL container started successfully."
echo "Database is accessible at ${DB_HOST}:${DB_PORT}"
echo "Default credentials: User: ${DB_USER}, Password: ${DB_PASS}, Database: ${DB_NAME}"
echo "To stop the container, run: docker stop postgres_container"
echo "To start it again, run: docker start postgres_container"
echo "To remove it, run: docker rm -f postgres_container"
