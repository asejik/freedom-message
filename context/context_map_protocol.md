\# Context Map Protocol

Defines how `\_CONTEXT\_MAP.md` is generated and used to maintain project structure awareness.

\## Step 1: Automated Map Generation

\### For React/Node/Web Projects

Run:

npx tree-node-cli -I "node\_modules|dist|.git|.next" --dirs-first > \_CONTEXT\_MAP.md

Code





\### For Python/Streamlit Projects

find . -maxdepth 3 -not -path '/.' -not -path './pycache\*' > \_CONTEXT\_MAP.md

Code





\---

\## Step 2: Teleport Prompt

Use this prompt when starting a new chat:

“I have uploaded a file named `\_CONTEXT\_MAP.md` which contains the file structure of my current project.  

1\. Read this map first to understand the architecture and file locations.  

2\. When I ask for a feature, identify the specific file paths from the map that you need to edit.  

3\. Do not ask for full file contents unless they are relevant to the task.”

\---

\## Step 3: VS Code Automation

\### Using RunOnSave

Install:

\- `emeraldwalk.RunOnSave`

Add to settings.json:

```json

{

&#x20; "emeraldwalk.runonsave": {

&#x20;   "commands": \[

&#x20;     {

&#x20;       "match": ".\*",

&#x20;       "cmd": "cd \\"${workspaceFolder}\\" \&\& npx tree-node-cli -I \\"node\_modules|dist|.git|.next\\" --dirs-first > \_CONTEXT\_MAP.md"

&#x20;     }

&#x20;   ]

&#x20; }

}

Alternative Extensions

&#x09;• Project Context

&#x09;• Repomix

These allow right-click → “Copy Project Context”.



