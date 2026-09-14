"""Generate backend/pdf/renderer.py from a clean template.

Run this script to (re)write the renderer file to disk.  The template is
written as a Python string so we never fight shell-escaping of backslashes
and quotes through the editor tool.
"""
from __future__ import annotations

import pathlib

OUTPUT = pathlib.Path("backend/pdf/renderer.py").absolute()

_PHASE = "header"

