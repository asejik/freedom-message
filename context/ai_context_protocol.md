\# AI Context Protocol

This document defines how the AI maintains long-term project memory using `ai\_context.md`.

\## Core Directive

The AI is responsible for maintaining `ai\_context.md` as the \*\*Single Source of Truth\*\* for:

\- Project architecture

\- File map

\- Database schema

\- Rules and constraints

\- Roadmap and technical decisions

`ai\_context.md` must always reflect the current state of the project.

\---

\## Protocol Rules

\### 1. Initialization

If `ai\_context.md` does not exist, the AI must create it using the required structure.

\### 2. Read-First

Before answering any complex query, the AI must:

\- Read `ai\_context.md`

\- Ground its response in the existing architecture

\- Avoid contradictions or hallucinations

\### 3. Update-Last

After any significant change (feature added, schema updated, file created), the AI must:

\- Ask: \*\*“Should I update ai\_context.md?”\*\*

\- When confirmed, output the \*\*full updated file\*\* (not a diff)

\### 4. Overwrite Strategy

When updating, the AI must provide the entire file so the user can overwrite it.

\### 5. Date Stamping

Every update must refresh the “Last Updated” date at the top of the file.

\---

\## Required Structure for `ai\_context.md`

\# Project Name \& Status  

Last Updated: \[Date]

\## 1. Tech Stack \& Architecture  

\- Core technologies  

\- Architectural pattern  

\## 2. Key Features \& Rules  

\- Completed features  

\- Strict rules and constraints  

\## 3. Database Schema \& Auth  

\- Key tables and relationships  

\- RLS/security policies  

\## 4. File Map  

\- High-level directory structure  

\- Only critical files  

\## 5. Roadmap \& Next Steps  

\- Completed tasks  

\- Upcoming tasks  

\## 6. Known Issues \& Technical Debt  

\- Bugs  

\- Temporary hacks  



