@echo off
if exist .env (
    echo .env file already exists.
) else (
    echo Creating .env from .env.example...
    copy .env.example .env
    echo .env created. Please update it with your real credentials.
)
