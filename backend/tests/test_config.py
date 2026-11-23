"""Startup must fail closed before connecting to external services."""
import os
import subprocess
import sys
from pathlib import Path


def run_config(value):
    env = dict(os.environ)
    for key in ("APP_ENV", "APP_ORIGIN", "DATABASE_URL", "REDIS_URL"):
        env.pop(key, None)
    if value is not None:
        env["APP_ENV"] = value
    return subprocess.run([sys.executable, "-c", "import app.core"], cwd=Path(__file__).resolve().parents[1], env=env, capture_output=True, text=True)


def test_missing_environment_defaults_to_production():
    result = run_config(None)
    assert result.returncode != 0
    assert "Production requires HTTPS" in result.stderr


def test_unknown_environment_is_rejected():
    result = run_config("prodution")
    assert result.returncode != 0
    assert "APP_ENV must be" in result.stderr
