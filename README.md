# To-Do List App

A full-stack To-Do List application featuring React, TailwindCSS, Clerk for authentication, Node.js/Express for the API, and Prisma + SQLite for the database. Users can sign up or sign in, then create, rename, delete to-do lists and add, edit, delete, or mark tasks as completed. The app also supports global search, “only incomplete” filtering, and A→Z/Z→A sorting for both lists and tasks. The layout is fully responsive.

## Project Structure

    todo-app/
    ├── todo-backend/   # Express API + Prisma + SQLite
    └── todo-frontend/  # React + TailwindCSS + Clerk

## Prerequisites

- Node.js v16 or later  
- npm (bundled with Node.js)  
- A Clerk account (free) for authentication  

## Setup & Run Locally

1. **Clone the repository**  
    
        git clone https://github.com/your-username/todo-app.git
        cd todo-app

2. **Back-end**  
    
        cd todo-backend
        npm install
        cp .env.example .env
        # Edit `.env` and set:
        #   CLERK_PUBLISHABLE_KEY=pk_<your-publishable-key>
        #   CLERK_SECRET_KEY=sk_<your-secret-key>
        #   DATABASE_URL="file:./dev.db"
        npx prisma db push
        npm run dev
    
   The API will be available at **http://localhost:4000**.

3. **Front-end**  
    
        cd ../todo-frontend
        npm install
        cp .env.example .env
        # Edit `.env` and set:
        #   REACT_APP_CLERK_PUBLISHABLE_KEY=pk_<same-publishable-key>
        npm start
    
   The React app will open at **http://localhost:3000**, proxying `/api` requests to port 4000.

## Usage

- **Sign up / Sign in** using the Clerk form.  
- **Lists**: create new lists, click ✎ to rename, 🗑 to delete, click header to expand/collapse.  
- **Tasks**: inside an expanded list, use the “+” form to add, click text or ✎ to edit inline, ☑ to toggle complete, 🗑 to delete.  
- **Global Controls**:  
  - **Search** box filters tasks across all lists (matches highlighted).  
  - **“Only incomplete”** checkbox hides completed tasks and empty lists.  
  - **Sort** dropdowns for lists and tasks (A→Z / Z→A).

## Scripts

### Back-end (inside `todo-backend/`)
    
- `npm run dev` — start server with hot-reload  
- `npx prisma db push` — sync schema to SQLite  
- `npx prisma studio` — open database GUI  

### Front-end (inside `todo-frontend/`)
    
- `npm start` — start React development server  
- `npm run build` — create production build  
- `npm test` — run tests (if any)  

## Optional Deployment

- **Front-end**: import **todo-frontend** into Vercel, set Root Directory to `todo-frontend`, add `REACT_APP_CLERK_PUBLISHABLE_KEY` in Vercel env vars, then deploy.  
- **Back-end**: deploy **todo-backend** to any Node.js host (Heroku, Railway, etc.) with `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and `DATABASE_URL` set.

