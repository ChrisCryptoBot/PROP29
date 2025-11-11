#!/usr/bin/env python3
"""
Generate a comprehensive inventory of the entire Proper 2.9 codebase.

The script walks every file under the provided root, extracts top-level
function/class symbols when possible, computes file hashes for duplicate
detection, and assigns a heuristic diagnosis flag for audit purposes.

Outputs:
    - JSON report containing detailed metadata per file
    - CSV report for quick spreadsheet review
"""

from __future__ import annotations

import argparse
import ast
import csv
import hashlib
import json
import os
import re
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Set, Tuple


# Extensions treated as text for function extraction
PYTHON_EXTENSIONS = {".py"}
JAVASCRIPT_EXTENSIONS = {".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"}
SHELL_EXTENSIONS = {".sh", ".ps1", ".bat", ".cmd"}


JS_FUNCTION_PATTERNS: Tuple[re.Pattern[str], ...] = (
    re.compile(r"\bfunction\s+([A-Za-z0-9_]+)\s*\(", re.MULTILINE),
    re.compile(r"\bconst\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s+)?\([^=]*?\)\s*=>", re.MULTILINE),
    re.compile(r"\b(?:let|var)\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s+)?\([^=]*?\)\s*=>", re.MULTILINE),
    re.compile(r"\b([A-Za-z0-9_]+)\s*=\s*(?:async\s+)?\([^=]*?\)\s*=>", re.MULTILINE),
    re.compile(r"\bexport\s+default\s+function\s+([A-Za-z0-9_]+)?\s*\(", re.MULTILINE),
    re.compile(r"\bclass\s+([A-Za-z0-9_]+)\s+", re.MULTILINE),
)

SHELL_FUNCTION_PATTERN = re.compile(r"^([A-Za-z0-9_]+)\s*\(\s*\)\s*\{", re.MULTILINE)

KEYWORDS_OBSOLETE = {"obsolete", "deprecated", "old_version"}
KEYWORDS_OUTDATED = {"old", "legacy", "archive", "backup"}
KEYWORDS_PROBLEMATIC = {"conflict", "broken", "problem", "tmp"}


@dataclass
class FileRecord:
    relative_path: str
    absolute_path: Path
    size_bytes: int
    modified_time: str
    extension: str
    content_hash: Optional[str] = None
    symbols: List[str] = field(default_factory=list)
    diagnosis: str = "pending"
    notes: List[str] = field(default_factory=list)


def compute_sha256(path: Path) -> Optional[str]:
    """Compute SHA256 hash of a file, returning None if file is unreadable."""
    try:
        hasher = hashlib.sha256()
        with path.open("rb") as fh:
            for chunk in iter(lambda: fh.read(1024 * 1024), b""):
                hasher.update(chunk)
        return hasher.hexdigest()
    except (OSError, PermissionError):
        return None


def extract_python_symbols(path: Path) -> List[str]:
    try:
        source = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        try:
            source = path.read_text(encoding="latin-1")
        except Exception:
            return []
    except Exception:
        return []

    try:
        module = ast.parse(source)
    except SyntaxError:
        return []

    # The ast.walk approach above adds classes but keeps them in stack indefinitely.
    # For better accuracy we re-walk using NodeVisitor with explicit scope handling.
    class SymbolVisitor(ast.NodeVisitor):
        def __init__(self) -> None:
            self.scope: List[str] = []
            self.collected: List[str] = []

        def visit_ClassDef(self, node: ast.ClassDef) -> None:
            self.collected.append(self._qualify(node.name))
            self.scope.append(node.name)
            self.generic_visit(node)
            self.scope.pop()

        def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
            self.collected.append(self._qualify(node.name))
            self.generic_visit(node)

        def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
            self.collected.append(self._qualify(node.name))
            self.generic_visit(node)

        def _qualify(self, name: str) -> str:
            if self.scope:
                return ".".join(self.scope + [name])
            return name

    visitor = SymbolVisitor()
    visitor.visit(module)
    return sorted(set(visitor.collected))


def extract_js_symbols(path: Path) -> List[str]:
    try:
        source = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        try:
            source = path.read_text(encoding="latin-1")
        except Exception:
            return []
    except Exception:
        return []

    symbols: Set[str] = set()
    for pattern in JS_FUNCTION_PATTERNS:
        for match in pattern.finditer(source):
            name = match.group(1)
            if name:
                symbols.add(name)
    return sorted(symbols)


def extract_shell_symbols(path: Path) -> List[str]:
    try:
        source = path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return []
    return sorted(set(SHELL_FUNCTION_PATTERN.findall(source)))


def extract_symbols(path: Path, extension: str) -> List[str]:
    if extension in PYTHON_EXTENSIONS:
        return extract_python_symbols(path)
    if extension in JAVASCRIPT_EXTENSIONS:
        return extract_js_symbols(path)
    if extension in SHELL_EXTENSIONS:
        return extract_shell_symbols(path)
    return []


def classify_record(record: FileRecord, duplicates: Dict[str, List[str]]) -> None:
    lower_path = record.relative_path.lower()

    if record.size_bytes == 0:
        record.diagnosis = "problematic"
        record.notes.append("Empty file")
        return

    if record.content_hash and len(duplicates.get(record.content_hash, [])) > 1:
        record.diagnosis = "duplicate"
        record.notes.append(
            "Shares identical content with: "
            + ", ".join(path for path in duplicates[record.content_hash] if path != record.relative_path)
        )
        return

    if any(keyword in lower_path for keyword in KEYWORDS_OBSOLETE):
        record.diagnosis = "obsolete"
        record.notes.append("Path suggests deprecated/obsolete content")
        return

    if any(keyword in lower_path for keyword in KEYWORDS_OUTDATED):
        record.diagnosis = "outdated"
        record.notes.append("Path suggests archived or legacy content")
        return

    if any(keyword in lower_path for keyword in KEYWORDS_PROBLEMATIC):
        record.diagnosis = "problematic"
        record.notes.append("Path indicates potential conflict or temporary file")
        return

    if "node_modules" in lower_path or "venv" in lower_path or "site-packages" in lower_path:
        record.diagnosis = "third_party"
        record.notes.append("Third-party dependency content (assumed needed)")
        return

    if record.extension in {".md", ".txt"}:
        record.diagnosis = "needed"
        record.notes.append("Documentation/reference material")
        return

    if record.extension in {".json", ".yaml", ".yml"} and "package" in lower_path:
        record.diagnosis = "needed"
        record.notes.append("Build/package configuration")
        return

    record.diagnosis = "needed"
    record.notes.append("Active project asset (function extraction completed where applicable)")


def walk_files(root: Path) -> Iterable[FileRecord]:
    for dirpath, dirnames, filenames in os.walk(root):
        for filename in filenames:
            absolute_path = Path(dirpath) / filename
            relative_path = str(absolute_path.relative_to(root))
            try:
                stat = absolute_path.stat()
            except (OSError, PermissionError):
                continue
            extension = absolute_path.suffix.lower()
            modified_time = datetime.fromtimestamp(stat.st_mtime).isoformat()
            record = FileRecord(
                relative_path=relative_path,
                absolute_path=absolute_path,
                size_bytes=stat.st_size,
                modified_time=modified_time,
                extension=extension,
            )
            # Hash binaries and text alike (hashing handles permission errors separately)
            record.content_hash = compute_sha256(absolute_path)

            # Function extraction may be expensive for very large files.
            if stat.st_size > 5 * 1024 * 1024:
                record.notes.append("Skipped symbol extraction due to file size >5MB")
            elif "node_modules" in relative_path:
                record.notes.append("Skipped symbol extraction for third-party dependency")
            else:
                record.symbols = extract_symbols(absolute_path, extension)

            yield record


def write_reports(records: List[FileRecord], stem: Path) -> None:
    json_path = stem.with_suffix(".json")
    csv_path = stem.with_suffix(".csv")

    json_payload = [asdict(record) for record in records]
    for item in json_payload:
        # absolute paths are redundant in report; drop them to keep file portable
        item.pop("absolute_path", None)
    json_path.parent.mkdir(parents=True, exist_ok=True)
    with json_path.open("w", encoding="utf-8") as fh:
        json.dump(json_payload, fh, ensure_ascii=False, indent=2)

    with csv_path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(
            [
                "relative_path",
                "size_bytes",
                "modified_time",
                "extension",
                "diagnosis",
                "symbols",
                "notes",
            ]
        )
        for record in records:
            writer.writerow(
                [
                    record.relative_path,
                    record.size_bytes,
                    record.modified_time,
                    record.extension,
                    record.diagnosis,
                    "; ".join(record.symbols),
                    "; ".join(record.notes),
                ]
            )


def build_duplicate_index(records: Iterable[FileRecord]) -> Dict[str, List[str]]:
    duplicates: Dict[str, List[str]] = {}
    for record in records:
        if not record.content_hash:
            continue
        duplicates.setdefault(record.content_hash, []).append(record.relative_path)
    return duplicates


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a full file inventory with diagnostics.")
    parser.add_argument(
        "--root",
        type=Path,
        default=Path("."),
        help="Root directory to scan (defaults to current working directory)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("reports/full_codebase_inventory"),
        help="Output file stem (without extension). JSON and CSV will be created.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    root = args.root.resolve()

    if not root.exists():
        raise SystemExit(f"Root path does not exist: {root}")

    print(f"[inventory] Scanning root: {root}")
    records = list(walk_files(root))
    print(f"[inventory] Files discovered: {len(records)}")

    duplicate_index = build_duplicate_index(records)
    for record in records:
        classify_record(record, duplicate_index)

    write_reports(records, args.output.resolve())
    print(f"[inventory] Reports written to {args.output}.json and {args.output}.csv")


if __name__ == "__main__":
    main()


