# KAMENJA ENTERPRISES - Wholesale E-Commerce Platform

A complete, modern wholesale e-commerce platform built with Next.js 16, React 19, TypeScript, Tailwind CSS, and PostgreSQL (via Drizzle ORM).

## 🚀 Features
- **Public Website**: Homepage, Product Catalog, Category Browser, Product Details, Quote Requests, About Us, Contact.
- **Admin Dashboard**: Secure login, Product Management (CRUD, Bulk Actions, Image Uploads), Inventory Tracking, Order Management, Customer & Supplier Management, Promotions, Reports, and Settings.
- **Database**: PostgreSQL with a robust schema for products, categories, orders, customers, suppliers, stock movements, and promotions.

## 🛠️ Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes & Server Actions
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM

## 📦 Installation & Setup

1. **Unzip the project**:
   Extract `kamenja-enterprises-full-project.zip` to your desired folder.

2. **Install Dependencies**:
   Open your terminal in the project folder and run:
   ```bash
   npm install
   ```

3. **Setup Database**:
   - Ensure you have PostgreSQL installed and running locally.
   - Create a database named `kamenja_db`.
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Update the `DATABASE_URL` in `.env` with your local PostgreSQL credentials.
   - Push the database schema:
     ```bash
     npx drizzle-kit push
     ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Admin Login
- **URL**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Username**: `admin`
- **Password**: `Kamenja2`

## 📁 Project Structure
- `src/app/`: Next.js App Router pages and API routes.
- `src/components/`: React components (Admin Panel, Product Manager, Header, Footer, etc.).
- `src/db/`: Database schema (`schema.ts`), connection (`index.ts`), and seeding logic.
- `public/`: Static assets and uploaded product images (`public/uploads/`).

## 🖼️ Image Uploads
Product images uploaded via the Admin Dashboard are stored in the `public/uploads/` directory. Ensure this folder has write permissions if deploying to a server.

## 🚢 Deployment
This project requires a **Node.js environment** (VPS or Node.js hosting). It cannot run on standard PHP Shared Hosting.
- Build the project: `npm run build`
- Start the production server: `npm start`
