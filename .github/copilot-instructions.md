## graphify

Before answering architecture or codebase questions, read `graphify-out/GRAPH_REPORT.md` if it exists.
If `graphify-out/wiki/index.md` exists, navigate it for deep questions.
Type `/graphify` in Copilot Chat to build or update the knowledge graph.

## Implementation scope

Before implementing a task, inspect only the files and modules relevant to the requested change.

Start with:
1. Architecture rules relevant to the task.
2. The target module.
3. Direct dependencies/interfaces of that module.
4. Database schema/migrations only when the task affects persistence.
5. Existing shared infrastructure only when it will be reused.

Do not recursively read the entire repository or unrelated modules just to gain context. Expand inspection only when the existing code or architecture requires it.

Prefer repository structure, Graphify/indexed project context, and targeted search to locate relevant code before opening large files.
