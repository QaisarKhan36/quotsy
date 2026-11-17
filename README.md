# Quotsy: Invoice & Quote Maker

Quotsy is a mobile app for people in small trades (cleaners, handymen, plumbers, electricians, landscapers, painters, photographers) to make a quote or invoice on their phone in about 30 seconds and send it as a PDF.

Most of these people don't want accounting software. They just need to send something that looks professional, quickly, from the job site. That's what this app does.

It's built with Expo (React Native), so one codebase runs on Android and iOS.

Website: https://qaisarkhan36.github.io/quotsy/

## What it does

- Pick your trade during setup, and common services and prices are filled in for you
- Make invoices and quotes, and turn a quote into an invoice with one tap
- Save clients and items so you don't type them again
- Branded PDFs with your logo, accent color, payment details and tax ID
- Discounts (% or fixed), tax/VAT/GST and 16 currencies
- Track status: Draft, Sent, Paid, Overdue, and Accepted / Declined / Expired for quotes
- Home dashboard with what's outstanding, what's overdue, what was paid this month and open quotes
- Works offline, and the data stays on the phone
- Free plan: 3 documents a month with a small footer on the PDF. Pro: unlimited, no footer, payment reminders

## How it works

- **Screens:** Expo Router, with tabs for Home, Clients, Items and Settings, plus the editor, the document view, onboarding and the Pro screen.
- **Data:** everything lives in one store (React context) that's saved as JSON in AsyncStorage, so the app works without internet and there's no server to run.
- **Totals:** `calc.ts` works out line totals, discount, tax and the final amount, and also figures out if an invoice is overdue.
- **PDFs:** `pdf.ts` builds the invoice as an HTML template, `expo-print` turns it into a PDF, and `expo-sharing` opens the share sheet so it can go out on WhatsApp, email or anything else.
- **Logo:** `expo-image-manipulator` resizes the logo so the PDFs stay small.
- **Pro subscriptions:** RevenueCat (`react-native-purchases`) on top of Google Play billing.
- **Builds:** a GitHub Actions workflow runs the EAS cloud build, so I can get an `.apk` for testing or an `.aab` for the Play Store without building on my laptop.

## Project structure

```
src/app/            screens (Expo Router)
  (tabs)/           Home, Clients, Items, Settings
  doc/edit.tsx      invoice/quote editor
  doc/[id].tsx      document view, PDF share, mark paid, convert
  onboarding.tsx    first-run setup
  paywall.tsx       Pro upgrade screen
src/lib/            data store, totals, PDF template, purchases, trade presets
docs/               website + privacy policy (GitHub Pages)
store-assets/       Play Store graphics
launch/             store listing text and my launch checklist
```

## Running it

```bash
npm install
npx expo start        # scan the QR code with Expo Go
npx tsc --noEmit      # typecheck
npx expo lint
```

In-app purchases only work in a real build, not in Expo Go.

## Tech

TypeScript, React Native, Expo (Router, Print, Sharing, Image Picker, Image Manipulator), AsyncStorage, RevenueCat, GitHub Actions, EAS Build
