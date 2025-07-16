# To-Do List App

A full-stack To-Do List application featuring React, TailwindCSS, Clerk for authentication, Node.js/Express for the API, and Prisma + SQLite for the database. Users can sign up or sign in, then create, rename, delete to-do lists and add, edit, delete, or mark tasks as completed. The app also supports global search, “only incomplete” filtering, and A→Z/Z→A sorting for both lists and tasks. The layout is fully responsive.

## LIVE DEMO

https://todo-app-vqus.vercel.app

^^ Using Vercel to host the Frontend and Render for Backend

NOTE: I am using Render's free tier which auto-shutsdown after periods of inactivity, so might have to nudge it to launch and then retry Vercel after a bit.

## Project Structure

    todo-app/
    ├── todo-backend/   # Express API + Prisma + SQLite
    └── todo-frontend/  # React + TailwindCSS + Clerk

## Prerequisites

- Node.js v16 or later  
- npm  
- A Clerk account (free) for authentication  

## Setup & Run Locally

1. **Clone the repository**  
   
       git clone https://github.com/your-username/todo-app.git  
       cd todo-app  

2. **Back-end**  
   
       cd todo-backend
       npm install
       # Add / Edit env file and set:
       #   CLERK_PUBLISHABLE_KEY=pk_<your-publishable-key>
       #   CLERK_SECRET_KEY=sk_<your-secret-key>
       #   DATABASE_URL="file:./dev.db"
       #   FRONTEND_URL="http://localhost:3000" // default local port for frontend
       npx prisma db push
       npm run dev
   
   The API will be available at **http://localhost:4000**. Will show error since this is purely backend.

3. **Front-end**  
   
       cd ../todo-frontend
       npm install
       # Add / Edit env file and set:
       #   REACT_APP_CLERK_PUBLISHABLE_KEY=pk_<same-publishable-key>
       #   REACT_APP_API_BASE_URL="http://localhost:4000" // default local port for backend
       npm start
   
   The React app will open at **http://localhost:3000**, proxying '/api' requests to port 4000.

## Features

- **Sign up / Sign in** using the Clerk form.  
- **Lists**: create new lists, click pencile icon to rename, trash icon to delete, click header to expand/collapse.  
- **Tasks**: inside an expanded list, use the "+" form to add, click text or pencil icon to edit inline, checkbox to toggle complete, trash icon to delete.  
- **Global Controls**:  
  - **Search** box filters tasks across all lists.  
  - **“Only incomplete”** checkbox hides completed tasks and empty lists.  
  - **Sort** dropdowns for lists and tasks (A → Z / Z → A).  
