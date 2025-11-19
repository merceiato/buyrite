# BuyRight / BuyRite Project

This repo contains both the **backend API** and the **frontend single page app** for BuyRight.

- Backend: Node.js + Express + MongoDB (Atlas), with JWT auth and basic file upload for avatars and product images.
- Frontend: Plain JavaScript views using lit-html, a custom SPA router, Shoelace web components, SCSS, and a couple of small helper modules (Auth, ProductAPI, UserAPI, Utils, Toast).

The idea is to provide separate **consumer** and **vendor** flows in the same app: shoppers can browse items and see ethical ratings, and vendors can log in to manage their own listings.

---

## 1. Project Structure (high level)

Backend lives in its own folder on the server (Node project), and the frontend is a separate build (bundled with Parcel) that just talks to the backend over HTTP.

text
backend/
  server.js           # Express entry point
  routes/
    auth.js
    user.js
    product.js
  models/
    User.js
    Product.js
  middleware/
    uploadAvatar.js
  utils.js            # auth + file helpers
  public/
    images/           # avatar + product images

frontend/
  index.html
  index.js
  App.js
  Auth.js
  Router.js
  ProductAPI.js
  UserAPI.js
  Toast.js
  Utils.js
  components/
    br-app-header.js
  views/
    pages/            # signin, signup, profile, vendor, consumer, buyrite etc.
  scss/
    master.scss
    _vars.scss
    _base.scss
    _forms.scss
    _shoelace.scss
    _toast.scss
    _questionnaire.scss
    _vendorManageListings.scss
    _vendorPreviewItems.scss


(The exact folder names might differ a bit on the machine, but that’s the basic idea.)

---

## 2. Backend – Setup & Run

### Prerequisites

- Node.js (LTS is fine)
- NPM
- A MongoDB Atlas cluster (or local Mongo instance)
- A .env file with all the required values

### Environment variables

Create a .env file in the backend root with something like:

env
PORT=3000
MONGO_URI=<your mongodb connection string>
ACCESS_TOKEN_SECRET=<some-long-random-string>


> Note for later: on my EC2 instance I also had to run npm install mongodb in the backend folder because it wasn’t picked up by default when I first deployed.

### Install dependencies

bash
npm install


### Start the backend (local dev)

bash
npm start


By default it listens on http://localhost:3000 (or whatever PORT is set to).

Static files (uploaded images) are served from:

text
/public/images


and are referenced in the frontend as:

text
${App.apiBase}/images/<filename>


### Deploying the backend (EC2 notes)

Very quick notes so I don’t forget this later:

- SSH into the EC2 box
- Pull / copy the backend project folder
- Run:

  bash
  npm install
  npm install mongodb   # in case it isn’t present
  

- Create the .env with the production MONGO_URI, ACCESS_TOKEN_SECRET, and PORT=3000
- Use something like pm2 or a simple screen/tmux session to keep the Node process alive:

  bash
  npx pm2 start server.js --name buyright-api
  

- Make sure security groups and the EC2 firewall expose port 3000 (or set up Nginx as a reverse proxy on port 80/443 and forward to Node).

Current deployed backend API base is set in App.js:

js
this.apiBase = 'http://ec2-54-253-51-41.ap-southeast-2.compute.amazonaws.com:3000'


If that changes, only App.js needs to be updated. fileciteturn5file0

---

## 3. Frontend – Setup & Run

The SPA is bundled with Parcel and rendered into <div id="root"></div> in index.html. Shoelace is pulled in via CDN. fileciteturn5file2turn5file3

### Install dependencies

From the frontend root:

bash
npm install


(If this project is sitting in one repo, this is the same command as above – the important thing is that parcel and other dev deps are installed.)

### Dev server

bash
npm run dev


This runs the Parcel dev server (usually on http://localhost:1234) and hot‑reloads when files change.

### Production build

bash
npm run build


Parcel outputs a dist/ folder that can be uploaded to static hosting (Netlify, Vercel, S3 + CloudFront, etc).

### Deploying the frontend

Basic steps I’m following / will follow:

1. Build:

   bash
   npm run build
   

2. Upload the dist/ folder to a static host (e.g. Netlify):

   - In Netlify, point it at the repo and set build command to npm run build, publish directory dist.
   - Make sure the **API base URL in App.js** points at the live backend.

3. After deployment the frontend URL will look something like:

   text
   https://<frontend-name>.netlify.app
   

   That URL is what goes into the assignment/project details file for the marker.

---

## 4. Frontend – Key Modules

### App.js

- Holds global config:
  - name, version
  - apiBase
  - reference to rootEl (#root in index.html)
- On init():
  - initialises the Toast system
  - calls Auth.check() and then boots the router on success fileciteturn5file0

### Auth.js

- Handles:
  - sign up (POST /user)
  - sign in (POST /auth/signin)
  - token validation (GET /auth/validate)
  - sign out (clears localStorage and redirects to /signin)
- Stores currentUser with fields from the backend (including accessLevel and newUser), and uses those to decide whether to send a user to /guide, /vendor, or /buyrite after login. fileciteturn5file1

### Router.js

- Very small SPA router:
  - routes map path → view object
  - init() sets up the initial route and popstate listener
  - gotoRoute(pathname) pushes history and calls the view init()
  - anchorRoute(e) helper so <a> tags can be wired into the router instead of doing full page loads fileciteturn5file5

### ProductAPI.js

- Wraps all product‑related fetch calls:
  - getvendorManageListings() – vendor’s own products (auth required)
  - createListing(formData)
  - updateListing(id, formData)
  - deleteListing(id)
  - getPublicProducts() – public consumer list (no auth needed)
- Applies the bearer token from localStorage.accessToken automatically via authHeader. fileciteturn5file4

### UserAPI.js

- Used for profile and edit profile pages:
  - getUser(userId)
  - updateUser(userId, userData, dataType = "form") – supports both FormData and JSON payloads. fileciteturn5file7

### Toast.js and Utils.js

- Toast:
  - Creates a small toast container in <body>
  - Shows a message and animates it in/out with GSAP
- Utils:
  - Simple isMobile() helper
  - pageIntroAnim() to animate .page-content on view change fileciteturn5file6turn5file8

---

## 5. Roles and Sample Flow (very short)

The system uses accessLevel to separate roles:

- 1 → consumer
- 2 → vendor

Typical flow:

1. User signs up (can also upload an avatar later via profile).
2. On first sign in (newUser === true), they see the guide/onboarding view.
3. Returning users go straight to either:
   - /buyrite (consumer)
   - /vendor (vendor dashboard)

From there:

- Consumers can:
  - fill out the questionnaire
  - browse the BuyRight grid with search, category, and ethics filter
  - view and edit their profile, including avatar upload
- Vendors can:
  - see the vendor dashboard
  - manage listings (create/edit/delete)
  - preview how their items will appear to shoppers
  - edit their profile

---

## 6. Notes for Future Me

- If the backend moves to a different server or port, update App.apiBase and redeploy the frontend.
- If uploads stop working:
  - check the /public/images folder exists on the backend
  - check file permissions on that folder on EC2
- If sign‑in keeps redirecting back to /signin:
  - clear localStorage
  - make sure ACCESS_TOKEN_SECRET matches between deployments
- When cloning this to a new machine:
  - npm install in the backend folder
  - npm install in the frontend (if it’s a separate folder)
  - create a fresh .env with correct MONGO_URI, etc.

That’s basically everything I need to get this running again without digging through the code.
