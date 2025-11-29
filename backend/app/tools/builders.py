"""Claude Agent SDK configuration builder.

This module provides a simplified configuration builder that uses the built-in
Claude Agent SDK tools (Read, Write, Bash) instead of custom MCP tools.
"""

from __future__ import annotations

from pathlib import Path

from claude_agent_sdk import ClaudeAgentOptions


SYSTEM_PROMPT = (
    "You are a software engineer. "
    "You should scaffold the template non-interactively with: "
    "'pnpm create vite <project-name> --template react --no-rolldown --no-interactive'. "
    "After scaffolding, run `pnpm i` to install the dependencies. "
    "Only modify the necessary code to fulfill the user's instructions. "
    "Run `pnpm run build` to build the project."
)


def build_claude_options(project_root: Path) -> ClaudeAgentOptions:
    """Build Claude Agent options with built-in tools.

    Args:
        project_root: The project directory where Claude will operate.

    Returns:
        Configured ClaudeAgentOptions with built-in Read, Write, and Bash tools.
    """
    print(f"Project root for Claude Agent: {project_root}")
    return ClaudeAgentOptions(
        allowed_tools=[
            "Read",
            "Write",
            "Edit",
            "Glob",
            "Grep",
            "Bash",
            "BashOutput",
            "KillShell",
            "WebSearch",
            "WebFetch",
            "TodoWrite",
            "Task",
            "ExitPlanMode",
        ],
        permission_mode="acceptEdits",
        cwd=str(project_root),
        system_prompt=SYSTEM_PROMPT,
    )
