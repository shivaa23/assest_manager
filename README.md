# Parni Jewels

A full-stack Indian jewellery ecommerce application built with the PERN stack (Postgres, Express, React, Node).

## Features

- **Authentication**: Local session-based auth (Login/Register).
- **Product Catalog**: Categories (Earrings, Mangalsutra, etc.), Search, Filtering.
- **Cart & Checkout**: Persistent cart, Razorpay integration stub, COD support.
- **Orders**: Order tracking and history.
- **Admin**: Basic product management (via API/seeded data).
- **SEO**: Dynamic meta tags, SEO-friendly URLs.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Shadcn UI, Framer Motion.
- **Backend**: Node.js, Express, Passport.js.
- **Database**: PostgreSQL with Drizzle ORM.

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env` and fill in the values.
   ```bash
   cp .env.example .env
   ```
   *Note: On Replit, `DATABASE_URL` is configured automatically.*

3. **Database Setup**:
   ```bash
   npm run db:push
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## API Documentation

- `GET /api/products` - List products
- `GET /api/products/:slug` - Get product details
- `POST /api/cart` - Add to cart
- `POST /api/orders` - Create order

## License

Private.
