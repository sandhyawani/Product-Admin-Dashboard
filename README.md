# Product Admin Dashboard

A Next.js product management dashboard built for the frontend assignment. It includes login, product listing, search/filter controls, pagination, and product add/edit/detail flows using the DummyJSON API with localStorage persistence for client-side mutation tracking.

## Features

- User login page with token-based auth
- Product dashboard with search, category filter, sorting, and pagination
- Product details view
- Add-new-product form
- Edit-product form
- Local persistence for created, updated, and deleted products
- Redirect flow from the root route to the login page

## Project Structure

- `app/login/page.jsx` — login screen
- `app/products/page.jsx` — product dashboard
- `app/products/new/page.jsx` — create product form
- `app/products/[id]/page.jsx` — product detail page
- `app/products/[id]/edit/page.jsx` — edit product form
- `services/` — API service layer
- `lib/axios.js` — shared Axios configuration
- `lib/productStorage.js` — local mutation persistence

## Getting Started

```bash
npm install
npm run dev
```

Then open http://localhost:3000 in the browser.

## Login Credentials

Use the DummyJSON demo credentials when prompted:

- username: `emilys`
- password: `emilyspass`

## Build

```bash
npm run build
```

## Notes

This project was completed by fixing the App Router route structure, adding the required Suspense boundary for `useSearchParams`, and preserving the existing product dashboard functionality while keeping the UI behavior intact.

## Problem solved

One issue I ran into was the broken route and query-string interpolation during the earlier implementation. The app was generating invalid paths such as `/products/₹{id}` and `/products?₹{params.toString()}`, which triggered 404 responses from DummyJSON. I fixed the template literals and verified the requests were going to the correct API endpoints.

## AI assistance

AI helped with code cleanup, comment reduction, and refactoring repetitive generated sections, but the core logic, debugging, and final validation were reviewed manually to keep the app understandable and maintainable.
