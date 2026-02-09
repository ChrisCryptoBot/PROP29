
import subprocess
import sys

with open("sys_admin_test_output.txt", "w", encoding="utf-8") as f:
    result = subprocess.run(
        [sys.executable, "-m", "pytest", "tests/test_system_admin_service.py", "-v"],
        capture_output=True,
        text=True,
        encoding="utf-8"
    )
    f.write(result.stdout)
    f.write(result.stderr)
