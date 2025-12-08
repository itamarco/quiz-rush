# Firebase Authentication Setup Guide

## Common Error: "The requested action is invalid"

This error typically occurs when the OAuth consent screen is not properly configured in Google Cloud Console. Follow these steps:

## Step 1: Find Your Firebase Project ID

**First, you need to identify your actual Firebase project name:**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Look at the project selector (top left) - this shows your project name
3. Click on **Project Settings** (gear icon)
4. Under **General** tab, find **Project ID** - this is what you'll see in Google Cloud Console
5. Note down your **Project ID** (it might be different from `quiz-rush-itc`)

**Important**: Firebase projects are automatically linked to Google Cloud Console projects with the same Project ID.

## Step 2: Configure OAuth Consent Screen (CRITICAL)

**This is the most common cause of "The requested action is invalid" error.**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. **Select your Firebase project**:
   - Click the project dropdown at the top
   - Search for your **Project ID** (from Step 1)
   - If you don't see it, make sure you're logged in with the same Google account used for Firebase
3. Navigate to **APIs & Services** > **OAuth consent screen**
4. If not configured, you'll see a setup wizard. Complete it:
   - **User Type**: Choose "External" (unless you have a Google Workspace)
   - **App name**: Enter your app name (e.g., "Quiz Rush")
   - **User support email**: Select your email
   - **Developer contact information**: Enter your email
   - Click **Save and Continue**
5. **Scopes**: Click "Save and Continue" (no need to add scopes manually)
6. **Test users** (if app is in Testing mode):
   - Add your email address as a test user
   - Click "Save and Continue"
7. **Summary**: Review and click "Back to Dashboard"

**Important**: If your app is in "Testing" mode, only test users can sign in. To make it public:

- Change **Publishing status** to "In production" (requires verification if using sensitive scopes)

## Step 3: Enable Authentication Providers in Firebase Console

### Enable Email/Password Authentication

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Authentication** > **Sign-in method**
4. Click on **Email/Password** provider
5. Toggle **Enable** to ON
6. Optionally enable **Email link (passwordless sign-in)** if desired
7. Click **Save**

### Enable Google Authentication

1. In the same **Sign-in method** page
2. Click on **Google** provider
3. Toggle **Enable** to ON
4. Enter your **Project support email** (required) - should match OAuth consent screen email
5. Click **Save**

## Step 4: Configure Authorized Domains

1. In Firebase Console, go to **Authentication** > **Settings** > **Authorized domains**
2. Make sure your domain is listed:
   - For local development: `localhost` should already be there
   - For production: Add your domain (e.g., `yourdomain.com`, `yourdomain.vercel.app`)

### For Vercel Deployment (CRITICAL)

**If you're deploying to Vercel, you MUST add your Vercel domain:**

1. Go to Firebase Console > **Authentication** > **Settings** > **Authorized domains**
2. Click **Add domain**
3. Add your Vercel domain (e.g., `quiz-rush-nine.vercel.app`)
   - **Important**: Add BOTH the preview domain AND production domain if they differ
   - Example: `quiz-rush-nine.vercel.app` and `your-custom-domain.com` (if you have one)
4. Click **Add**

**Also update OAuth Redirect URIs in Google Cloud Console:**

1. Go to [Google Cloud Console](https://console.cloud.google.com) > **APIs & Services** > **Credentials**
2. Find your OAuth 2.0 Client ID (Web client) - this is the same one used by Firebase
3. Under **Authorized redirect URIs**, add:
   - `https://YOUR-VERCEL-DOMAIN.vercel.app/__/auth/handler` (replace with your actual Vercel domain)
   - Example: `https://quiz-rush-nine.vercel.app/__/auth/handler`
4. Click **Save**

## Step 5: Verify Environment Variables

Make sure your `.env.local` file has all required variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

**Important**:

- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` should be in the format: `your-project-id.firebaseapp.com`
- Do NOT include `https://` prefix
- Make sure there are no trailing slashes

## Step 6: Verify Firebase Config

You can check if your config is loaded correctly by:

1. Opening browser console (F12)
2. Looking for any Firebase initialization errors
3. The improved error handling will now show specific error messages

## Step 7: Check Browser Console

After clicking "התחבר עם Google", check the browser console for:

- Specific error codes (e.g., `auth/unauthorized-domain`, `auth/invalid-api-key`)
- Configuration validation errors

## Common Error Codes and Solutions

| Error Code                  | Solution                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------ |
| `auth/unauthorized-domain`  | Add your domain to Firebase Console > Authentication > Settings > Authorized domains |
| `auth/invalid-api-key`      | Verify `NEXT_PUBLIC_FIREBASE_API_KEY` in `.env.local` matches Firebase Console       |
| `auth/popup-blocked`        | Allow popups in your browser settings                                                |
| `auth/popup-closed-by-user` | User closed the popup window (not an error)                                          |

## Step 8: Restart Development Server

After making changes to `.env.local`:

```bash
npm run dev
```

## Troubleshooting "The requested action is invalid"

If you're still seeing this error after completing the steps above:

1. **Verify OAuth Consent Screen is configured**:

   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials/consent)
   - Make sure the consent screen is published (not just saved as draft)
   - If in "Testing" mode, ensure your email is added as a test user

2. **Check OAuth Client ID**:

   - Go to Firebase Console > Authentication > Sign-in method > Google
   - Make sure "Web client ID" is displayed (not empty)
   - If empty, click "Save" again to regenerate

3. **Verify Authorized Redirect URIs**:

   - Go to Google Cloud Console > APIs & Services > Credentials
   - Find your OAuth 2.0 Client ID (Web client)
   - Under "Authorized redirect URIs", ensure these are present:
     - `https://YOUR-PROJECT-ID.firebaseapp.com/__/auth/handler` (replace with your actual Project ID)
     - `http://localhost:3000/__/auth/handler` (for local dev)
     - `http://localhost:3000` (for local dev)
     - **For Vercel**: `https://YOUR-VERCEL-DOMAIN.vercel.app/__/auth/handler` (e.g., `https://quiz-rush-nine.vercel.app/__/auth/handler`)

4. **Clear browser cache and cookies**:

   - Clear all cookies for `localhost` and `firebaseapp.com`
   - Try in an incognito/private window

5. **Check Firebase Console**:

   - Authentication > Sign-in method - Google should be **Enabled**
   - Verify your `authDomain` matches exactly: `your-project-id.firebaseapp.com` (use your actual Project ID)

6. **Wait a few minutes**: OAuth consent screen changes can take a few minutes to propagate

## Step 9: Configure Vercel Environment Variables

**If deploying to Vercel, make sure all Firebase environment variables are set:**

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add all required Firebase variables:

   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` (should be `your-project-id.firebaseapp.com`)
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `FIREBASE_ADMIN_PROJECT_ID`
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PRIVATE_KEY`

4. **Important**: Set these for **Production**, **Preview**, and **Development** environments
5. After adding variables, **redeploy your application** for changes to take effect

## Quick Fix Checklist

- [ ] OAuth consent screen configured in Google Cloud Console
- [ ] OAuth consent screen is published (not draft)
- [ ] Your email added as test user (if app is in Testing mode)
- [ ] Google Sign-in enabled in Firebase Console
- [ ] Project support email set in Firebase
- [ ] `localhost` in authorized domains
- [ ] **Vercel domain added to Firebase authorized domains** (if deploying to Vercel)
- [ ] **Vercel redirect URI added to Google Cloud Console** (if deploying to Vercel)
- [ ] Environment variables correctly set (both locally and in Vercel)
- [ ] Development server restarted after env changes
- [ ] Vercel deployment redeployed after adding environment variables
