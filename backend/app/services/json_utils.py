"""Utilities for parsing JSON returned by LLMs.

Some OpenAI-compatible vendors ignore `response_format={type:json_object}` and instead
return plain text or wrap JSON in code fences.

We provide a robust extractor that tries to recover the first JSON object/array.
"""

from __future__ import annotations

import json


def extract_json(text: str) -> object:
    """Extract the first JSON object/array from a string.

    Raises json.JSONDecodeError if nothing can be parsed.
    """

    s = text.strip()

    # Strip markdown code fences
    if s.startswith("```"):
        # remove first fence line
        s = "\n".join(s.splitlines()[1:])
        # remove trailing fence
        if s.rstrip().endswith("```"):
            s = s.rstrip()[:-3]
        s = s.strip()

    # First attempt: direct parse
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        pass

    # Find first '{' or '[' and last matching '}' or ']'
    start_candidates = [i for i in [s.find("{"), s.find("[")] if i != -1]
    if not start_candidates:
        raise json.JSONDecodeError("No JSON start found", s, 0)

    start = min(start_candidates)
    end_obj = s.rfind("}")
    end_arr = s.rfind("]")
    end = max(end_obj, end_arr)
    if end <= start:
        raise json.JSONDecodeError("No JSON end found", s, start)

    snippet = s[start : end + 1]
    return json.loads(snippet)
