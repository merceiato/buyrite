# BuyRite Project

This repository contains both the backend API and the frontend application for BuyRite.  
The backend is a Node/Express server with MongoDB, and the frontend is a LitElement-based SPA with SCSS styling and Shoelace components.

The goal of the project is to provide vendor and consumer flows for listing, browsing, and managing items in a simple marketplace-style interface.

---

## Backend Overview

The backend is built with:

- Node.js  
- Express  
- MongoDB and Mongoose  
- JSON Web Tokens for authentication  
- BCrypt for password hashing  

It exposes routes for user accounts, products, authentication, and vendor operations.  
Access levels are used to separate vendor features from general consumer features.

### Backend Structure (Simplified)



server.js              main entry point
routes/                API route handlers
models/                Mongoose models
utils/                 helper functions
middleware/            (if added later)



### Running the Backend

Install dependencies:

bash
npm install


Start the server:

bash
npm start


The server will run on the port defined in the config or environment variables.
Make sure MongoDB is running locally or that your connection string is correct.

---

## Frontend Overview

The frontend uses:

* LitElement for components
* Shoelace for UI elements
* SCSS for styling
* A small custom router for navigation
* A simple Auth module to manage logged-in state

The UI changes depending on whether the user is logged in and whether they are a vendor or consumer.

### Frontend Structure (Simplified)


src/
  components/  
  views/
  scss/
  Auth.js
  Router.js
public/
  images/


### Running the Frontend

Install dependencies:

bash
npm install


Start the dev server:

bash
npm run dev


Build for production:

bash
npm run build


The build output is usually placed in a dist/ directory, depending on your bundler.

---

## Authentication Flow

The backend provides login and signup endpoints.
Passwords are hashed using BCrypt, and JWTs are issued on successful login.
The frontend stores the token (usually in localStorage) and sends it with requests that require authentication.

Auth.currentUser is used on the frontend to determine menus and routes.

---

## Vendor and Consumer Roles

The system uses an accessLevel property:

* 1 for consumers
* 2 for vendors

The backend checks this for protected routes.
The frontend uses it to show or hide vendor-related pages.

---

## SCSS Organisation (Frontend)

The SCSS folder contains partials for base styles, forms, variables, Shoelace overrides, and specific pages such as vendor management and the questionnaire.
master.scss imports everything so it compiles into a single stylesheet.

---

## Header and Navigation (Frontend)

The br-app-header component handles:

* main navigation
* a drawer menu on mobile
* active route detection
* user menu and sign out
* vendor/consumer link variations

It runs route changes through the custom gotoRoute and anchorRoute helpers.

---

## API Notes

The backend provides routes for:

* user accounts
* authentication
* product listings
* vendor operations

Data is exchanged as JSON.
Uploaded images are served from the backend’s /images folder.

---

## Testing

Testing is not currently included, but recommended tools are:

Backend:

* Jest or Mocha
* Supertest for endpoint testing

Frontend:

* Jest or Vitest
* @web/test-runner
* lit-testing-library

---

## Project Setup Notes

* Keep .env files out of version control if used.
* Ensure MongoDB is running or the URI is set correctly.
* The frontend expects the API base URL to be consistent with the backend server.

---


