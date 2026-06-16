# Project Handover Documentation
## Architecture Overview

This project is a monorepo managed with **Nx** (`pnpm-workspace`). It consists of a Python/Django backend and two React/Vite frontends (Portfolio & CMS). Environment variables are injected dynamically via **Varlock** across the workspace.

### Backend (`apps/backend`)
- **Framework:** Django with Django REST Framework (DRF).
- **Environment:** Python managed by `uv`.
- **Database:** SQLite (`db.sqlite3`).
- **Authentication:** JWT via `djangorestframework-simplejwt`.
- **Media Storage:** 
  - Images (Projects/Blogs) are stored directly as Base64 strings in the database (`TextField`) to avoid complex media serving requirements and cloud storage dependencies. 
  - CV File is stored locally via `FileField`.
- **CORS:** Configured to allow all origins during development (`django-cors-headers`).

### Frontend: Portfolio (`apps/portfolio`)
- **Framework:** React + Vite + TypeScript.
- **Theme:** Default dark theme (`#121212`) with a red accent (`#e53935`), supporting a toggleable light mode via CSS variables (`data-theme="light"`).
- **Key Features:**
  - **Scroll Effects:** Sticky header that animates its background blur and padding via `framer-motion`'s `useScroll`.
  - **Carousels:** Uses `swiper` for Projects and Blogs. Configured specifically to left-align on load, center the active item, and use custom `SlideOverlay` interceptors.
  - **Interaction Security:** Click events on carousel items are tightly controlled. Dimmed items use custom overlay arrows (`FaChevronLeft`/`Right`) that intercept clicks to slide the carousel, preventing the modal from opening accidentally. Only the active (centered) card opens the detailed modal.
  - **3D Hover Effects:** Implemented using `framer-motion` springs and transforms based on mouse coordinates. The Swiper container has increased vertical padding (`6rem`) and `overflow: hidden` to allow the 3D cards to pop out vertically without clipping, while remaining masked horizontally.
  - **Markdown Parsing:** Text is rendered using `react-markdown` with `remark-gfm` (GitHub Flavored Markdown). Custom styling applied to blockquotes to match the red accent theme. Long text on cards is elegantly truncated using CSS `-webkit-line-clamp`.
  - **Dynamic Footer:** Spans full viewport width, displaying current year and dynamic "Last Updated" timestamp based on the latest project/blog entry.

### Frontend: CMS (`apps/cms`)
- **Framework:** React + Vite + TypeScript.
- **Theme:** Clean, bright layout.
- **Authentication:** JWT stored in `localStorage`, intercepted via Axios to append the `Bearer` token to all outgoing API requests.
- **Key Features:**
  - **Unified Modals:** Add and Edit workflows are consolidated into a single modal interface for Projects and Blogs.
  - **Image Workflow:** Images are added inside the modal. If creating a new item, the system queues the selected images, submits the creation POST request, retrieves the newly generated ID, and automatically sequentially POSTs the images to the `/upload_image/` endpoint before closing.
  - **Markdown Editor:** Integrated `react-simplemde-editor`.
  - **1:1 Preview:** The editor's native preview has been overridden using `ReactDOMServer.renderToString` to pipe content through the exact same `ReactMarkdown` component used by the Portfolio frontend, ensuring perfect styling parity (including custom blockquotes).
  - **Embedded Blog Images:** The Markdown toolbar includes a custom "Upload Image" action that converts local files to Base64 strings and injects them directly into the markdown body inline.
  - **URL Sanitization:** Automatic `https://` prepending for submitted links to prevent Django `URLField` validation errors.

## Execution & Start Commands
To spin up the entire stack concurrently, run:
```bash
npx nx run-many -t serve dev
```
This utilizes Varlock to inject environment variables into all applications dynamically.

## Future Considerations
- **Performance:** While Base64 database storage simplifies deployment, it heavily increases JSON payload sizes. If the portfolio grows significantly, consider migrating to S3/Cloudinary and standard `ImageField` URLs.
- **Image Optimization:** The frontend currently renders the raw Base64 strings. Adding a pre-compression step on the client or backend before saving would drastically reduce payload sizes.
- **Routing:** The portfolio is currently a single-page anchor application. Implementing `react-router-dom` could provide shareable URLs for specific modal content (e.g., `/project/123`).