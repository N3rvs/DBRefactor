# DBRefactor

This is a Next.js application for orchestrating database refactoring and code fixes.

## Getting Started

### Prerequisites

- Node.js (version 20 or later)
- npm, yarn, or pnpm

### Environment Variables

Create a `.env.local` file in the root of the project and add the following environment variable. This variable should point to the backend API for DBRefactor.

```
NEXT_PUBLIC_DBREFACTOR_API=http://localhost:7040
```

You can use the example file as a template:
```bash
cp .env.local.example .env.local
```

### Installation

First, install the dependencies:

```bash
npm install
```

### Running the Development Server

To run the development server, use the following command:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

The application has two main pages:
- **/refactor**: The main page for creating and applying refactoring plans.
- **/schema**: A page to analyze and view the database schema.

### Genkit AI Flow

This project uses Genkit for AI-powered refactoring suggestions. To run the Genkit flow locally for development, you may need to set up Google AI credentials and use the following command:

```bash
npm run genkit:dev
```

This will start the Genkit development server, which the Next.js application can interact with through server actions.
