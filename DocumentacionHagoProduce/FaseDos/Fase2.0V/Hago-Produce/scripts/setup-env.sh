#!/bin/bash

if [ -f .env ]; then
  echo ".env file already exists."
else
  echo "Creating .env from .env.example..."
  cp .env.example .env
  echo ".env created. Please update it with your real credentials."
fi
