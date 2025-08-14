# **App Name**: DBRefactor

## Core Features:

- Database Connection: Connect to a database using a connection string, storing only the session ID in memory for security.
- Schema Analyzer: Analyze the database schema and display tables, columns, foreign keys, and indexes.
- Refactoring Plan Builder: Create a refactoring plan with rename table, rename column, and add column operations.
- SQL Script Generation: Generate SQL scripts for rename, compatibility, and cleanup operations based on the refactoring plan.
- Refactoring Preview: Preview the SQL and code changes without applying them to the database.
- Apply Refactoring: Apply the refactoring plan, execute SQL scripts, and apply code fixes with confirmation.
- AI-Powered Refactoring Tool: Intelligently suggest optimal refactoring steps by using an LLM to automatically decide the ordering of renames and consider potential naming conflicts. The tool prioritizes minimal downtime by generating backward compatible SQL.

## Style Guidelines:

- Primary color: Deep blue (#2E3B55) to evoke professionalism and reliability.
- Background color: Dark gray (#1E293B) to provide a sophisticated and modern look with good contrast.
- Accent color: Teal (#2DD4BF) to highlight key actions and elements.
- Body and headline font: 'Inter', a sans-serif font known for its readability and modern appearance, is suited to both headlines and body text.
- Use minimalist and clear icons from a library like 'react-icons' to represent database elements, operations, and statuses.
- Employ a card-based layout (shadcn/ui) to organize different sections like connection, plan builder, and results.
- Incorporate subtle animations and transitions to provide visual feedback during actions like connecting, analyzing, and applying changes.