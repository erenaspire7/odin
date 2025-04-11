#!/bin/bash

# Pull the latest PostgreSQL image
echo "Pulling PostgreSQL Docker image..."
docker pull postgres:latest
docker pull redis:latest

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
if [ "$(docker ps -a -q -f name=postgres_container)" ]; then
  # Container exists, start it if not running
  if [ "$(docker ps -q -f name=postgres_container)" ]; then
    echo "postgres_container is already running"
  else
    echo "Starting existing postgres_container..."
    docker start postgres_container
  fi
else
  # Container doesn't exist, create it
  echo "Creating new postgres_container..."
  docker run --name postgres_container \
    -e POSTGRES_USER=${DB_USER} \
    -e POSTGRES_PASSWORD=${DB_PASS} \
    -e POSTGRES_DB=${DB_NAME} \
    -p ${DB_PORT}:5432 \
    -v postgres_data:/var/lib/postgresql/data \
    -d postgres:latest
fi

# Run Redis container with environment variables
if [ "$(docker ps -a -q -f name=redis_container)" ]; then
  # Container exists, start it if not running
  if [ "$(docker ps -q -f name=redis_container)" ]; then
    echo "redis_container is already running"
  else
    echo "Starting existing redis_container..."
    docker start redis_container
  fi
else
  # Container doesn't exist, create it
  echo "Creating new redis_container..."
  docker run --name redis_container -p 6379:6379 -d redis:latest
fi