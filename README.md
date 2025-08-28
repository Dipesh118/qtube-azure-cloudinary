
# QTube — Next.js + Firebase (Auth/Firestore) + Cloudinary (Video Storage)

This variant avoids Firebase Storage (which may prompt you to upgrade billing). It uses **Cloudinary's free tier** for video uploads via **unsigned upload preset**.

## Setup

### 1) Firebase (no billing)
- Enable **Authentication** (Email/Password)
- Enable **Firestore**
- Create `roles/{UID}` docs to mark creators: `{ role: "creator" }`
- Put these in `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 2) Cloudinary (no card required)
- Create free account → Dashboard shows **Cloud name**
- Settings → **Upload** → **Upload presets** → create **unsigned** preset (note the preset name)
- Add to `.env.local`:
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
```

### 3) Deploy with Azure Static Web Apps (Free)
- Push to GitHub, create SWA (Next.js preset), add all env vars in SWA **Configuration**, redeploy.

## Use
- Sign up on `/login`
- Add `{ role: "creator" }` to your UID at `roles/{uid}` in Firestore
- Upload via `/upload`
- Browse on `/` and `/search`, comment/rate in video detail

- [![Azure Static Web Apps CI/CD](https://github.com/Dipesh118/qtube-azure-cloudinary/actions/workflows/azure-static-web-apps-blue-rock-00f19c310.yml/badge.svg?branch=main)](https://github.com/Dipesh118/qtube-azure-cloudinary/actions/workflows/azure-static-web-apps-blue-rock-00f19c310.yml)


