
import subprocess
import sys

with open("test_output.txt", "w", encoding="utf-8") as f:
    result = subprocess.run(
        [sys.executable, "-m", "pytest", "tests/test_notification_service.py", "-k", "test_history_and_read", "-v", "-s"],
        capture_output=True,
        text=True,
        encoding="utf-8"
    )
    f.write(result.stdout)
    f.write(result.stderr)
