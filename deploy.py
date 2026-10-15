"""Build and deploy K-BEAUTY NOTE to Cloudflare Workers Static Assets (kbeauty.jworld.dev)."""

import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
NPM = "npm.cmd" if os.name == "nt" else "npm"
NPX = "npx.cmd" if os.name == "nt" else "npx"


def run(cmd):
    print("+", " ".join(cmd), flush=True)
    r = subprocess.run(cmd, cwd=HERE)
    if r.returncode != 0:
        sys.exit(r.returncode)


if __name__ == "__main__":
    if "--no-pull" not in sys.argv:
        run(["git", "pull", "--rebase", "--autostash", "origin", "main"])
    run([NPM, "install", "--no-audit", "--no-fund"])
    run([NPM, "run", "build"])
    run([NPX, "wrangler", "deploy"])
