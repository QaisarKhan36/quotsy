# Launch checklist (Android first)

No computer setup is needed. Everything below happens on websites.

### Step 1: Turn on the website (2 min)
GitHub → this repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch: **main**, folder **/docs** → Save.
After about a minute, https://qaisarkhan36.github.io/quotsy/privacy.html works. Google Play needs this link.

### Step 2: Expo account and token (5 min)
1. Sign up at https://expo.dev (free).
2. Avatar → **Account settings → Access tokens → Create token**. Name it `github`, then copy the token.
3. GitHub → this repo → **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `EXPO_TOKEN`
   - Value: the token you copied

### Step 3: Build the app in the cloud (about 20 min, automatic)
GitHub → **Actions** tab → **Build Android app** → **Run workflow**:
- choose **preview** to get an `.apk` you can install directly on your phone for testing
- choose **production** to get the `.aab` file for the Play Store

When it finishes, download the file from https://expo.dev → project **quotsy** → **Builds**.
The first build automatically creates your app's signing key, which Expo stores safely. Don't delete it.

### Step 4: Test on your phone
Install the **preview** `.apk` on an Android phone. Check: create an invoice → **Send invoice** → share the PDF to WhatsApp or email → open it.

### Step 5: Google Play Console ($25 one time)
1. https://play.google.com/console → create a developer account and complete identity verification.
2. **Create app** → name `Quotsy: Invoice & Quote Maker`, App, Free.
3. Fill in **Store listing** and **App content** using [`launch/STORE_LISTING.md`](launch/STORE_LISTING.md). Upload the images from `store-assets/`.
4. **Testing → Closed testing → Create track** → upload the **production** `.aab` → add testers' emails.
   New personal accounts need **at least 12 testers opted in for 14 days** before you can apply for production.
   Ask friends and family, or swap tests in communities such as r/AndroidClosedTesting.
5. After 14 days: **Apply for production** → submit for review (usually 1–7 days). 🎉

### Step 6: Turn on Pro subscriptions (after the app is in closed testing)
1. Play Console → **Monetize → Subscriptions**: create `quotsy_pro_monthly` ($4.99/month) and `quotsy_pro_annual` ($29.99/year).
2. Create a free https://www.revenuecat.com project → add the Android app (package `com.qaisarkhan.quotsy`) and connect Play with a service account (RevenueCat walks you through this).
3. In RevenueCat: create an entitlement named exactly **`pro`**, attach both products, and add them to the **default offering** as *Monthly* and *Annual* packages.
4. Copy RevenueCat's **public Android API key** into `app.json` → `extra.revenueCat.android`, commit, and run a new **production** build.
5. Set up a payments profile in Play Console (bank account) to get paid.

Until step 6 is done, the app works fully. The Pro screen says subscriptions are "not available yet".

### Also set before going public
- `app.json` → `extra.supportEmail`: an email where users can reach you. It enables "Contact support" in Settings.
