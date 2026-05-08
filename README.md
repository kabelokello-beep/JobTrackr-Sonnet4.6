# 📱 JobTrackr — Career Application Tracker

> A comprehensive job hunting companion — track, analyze, and improve every application.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## ✨ Features

### 📸 Job Capture with OCR
- Upload job flyers, screenshots, or images (PNG, JPG, WebP)
- Automatic OCR text extraction via Tesseract.js
- Auto-populates all job fields from the image
- Paste raw job advert text and extract fields instantly
- All fields remain fully editable after scanning

### 📋 Comprehensive Job Records
Every job stores:
- Job Title, Company, Industry, Location
- Website/URL, Source Type (LinkedIn, Indeed, WhatsApp, etc.)
- Qualifications & Experience required
- Key Responsibilities / JD summary
- Closing Date, Application Date
- Application Method, Contact Person / Recruiter
- Salary / Package
- Notes, Tags, Checklist items

### 🚦 Application Pipeline Tracking
Move jobs through stages:
```
Wishlist → Applied → Interview Scheduled → Interview Done → Offer → Hired
                                                          ↘ Rejected / No Response
```

### 📊 Career Analytics
- Total jobs saved, applied, interviews, offers, rejections
- Success rate and response rate percentages
- Monthly trend charts (Line chart)
- Application status distribution (Pie chart)
- Industry breakdown (Bar chart)
- Source effectiveness breakdown
- Identified skills gaps from lessons learned

### 📅 Calendar View
- Visual calendar showing deadlines and application dates
- Color-coded urgency (red = overdue, orange = <7 days, blue = future)
- Upcoming deadlines sidebar (next 14 days)
- Overdue alerts

### 📝 Lessons Learned (Per Job)
- What went well
- What went wrong
- Improvements for next time
- Strengths shown
- Weaknesses/skill gaps
- Follow-up actions
- Interview feedback notes

### 🔍 Outcome Comparison
Manual research section for each job:
- Who got hired (LinkedIn research)
- Their background
- What differentiated them
- Skills they had that you lacked
- Experience/industry fit analysis

### 🔔 Reminders & Deadlines
- Set reminders: 1 day, 3 days, 1 week before deadline
- Custom date/time reminders
- Overdue alerts on dashboard

### 🔎 Search & Organization
- Full-text search across all fields
- Filter by status, industry, source
- Sort by date, deadline, company, status
- Tags for custom categorization
- Favourites / priority jobs
- Archive old applications
- One-click duplicate detection

### 👤 Authentication
- Create an account with name + email
- Guest mode (no account required)
- All data stored locally (IndexedDB via Dexie.js)

### 💾 Data Management
- Offline-first (works without internet)
- Export to CSV (open in Excel/Sheets)
- Export to JSON (full backup)
- Import from JSON backup
- Sample data loader for demo/testing

### 🎨 UI/UX
- Mobile-first responsive design
- Dark mode support
- Clean sidebar navigation + mobile drawer
- Modern card-based job list
- Pipeline progress visualization

---

## 🚀 Quick Start (Web)

```bash
# Clone the repo
git clone https://github.com/your-username/jobtrackr.git
cd jobtrackr

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Visit `http://localhost:5173` in your browser.

---

## 📱 Android App Setup (Capacitor)

To wrap this web app as a native Android APK:

### Prerequisites
- Node.js 18+
- Android Studio (latest)
- Java JDK 17+
- Android SDK (API 33+)

### Step 1: Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init JobTrackr com.jobtrackr.app --web-dir dist
```

### Step 2: Build the web app

```bash
npm run build
```

### Step 3: Add Android platform

```bash
npx cap add android
npx cap sync android
```

### Step 4: Configure AndroidManifest.xml

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.INTERNET" />
```

### Step 5: Open in Android Studio

```bash
npx cap open android
```

In Android Studio:
1. Wait for Gradle sync to complete
2. Select your device/emulator
3. Click **Run** (▶) to test
4. Go to **Build → Generate Signed Bundle / APK** for release APK

### Step 6: Generate APK

```bash
# Debug APK (for testing)
cd android
./gradlew assembleDebug

# The APK will be at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

For release APK:
1. In Android Studio: **Build → Generate Signed Bundle/APK**
2. Create a new keystore
3. Fill in signing details
4. Select **APK** → **release**
5. APK will be in `android/app/build/outputs/apk/release/`

---

## 🍎 iOS App Setup (Capacitor)

```bash
# Install iOS platform
npm install @capacitor/ios
npx cap add ios
npx cap sync ios

# Open in Xcode
npx cap open ios
```

Requirements:
- macOS with Xcode 15+
- Apple Developer account (for App Store)

---

## 🔄 Workflow: Update → Rebuild → Sync

```bash
# After any code changes:
npm run build
npx cap sync

# For Android:
npx cap open android
# Or: npx cap run android
```

---

## 📁 Project Structure

```
jobtrackr/
├── src/
│   ├── components/
│   │   ├── JobFormModal.tsx      # Add/Edit job with OCR
│   │   ├── JobDetailModal.tsx    # View full job details
│   │   ├── Sidebar.tsx           # Desktop navigation
│   │   └── TopBar.tsx            # Mobile header + search
│   ├── db/
│   │   └── database.ts           # Dexie.js IndexedDB setup
│   ├── layouts/
│   │   └── MainLayout.tsx        # App shell
│   ├── pages/
│   │   ├── AuthPage.tsx          # Login / Register / Guest
│   │   ├── DashboardPage.tsx     # Home with summary cards
│   │   ├── JobsPage.tsx          # Job list + filters
│   │   ├── AnalyticsPage.tsx     # Charts and stats
│   │   ├── CalendarPage.tsx      # Deadline calendar
│   │   └── SettingsPage.tsx      # Preferences + data mgmt
│   ├── store/
│   │   └── useStore.ts           # Zustand global state
│   ├── utils/
│   │   └── helpers.ts            # Utility functions
│   ├── App.tsx                   # Root component
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Global styles
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS 4 |
| Database | Dexie.js (IndexedDB wrapper) |
| State | Zustand |
| OCR | Tesseract.js |
| Charts | Recharts |
| Icons | Lucide React |
| Dates | date-fns |
| File Upload | React Dropzone |
| Notifications | React Hot Toast |
| Mobile Wrapper | Capacitor (Android/iOS) |

---

## 🏗️ Google Play Store Publishing

### Step 1: Create Release APK/AAB

```bash
# Build App Bundle (recommended for Play Store)
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### Step 2: Sign the Bundle

```bash
keytool -genkey -v -keystore jobtrackr-release.keystore -alias jobtrackr -keyalg RSA -keysize 2048 -validity 10000
```

### Step 3: Configure signing in `android/app/build.gradle`

```groovy
android {
    signingConfigs {
        release {
            storeFile file('jobtrackr-release.keystore')
            storePassword 'your-store-password'
            keyAlias 'jobtrackr'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 4: Upload to Google Play Console
1. Go to [Google Play Console](https://play.google.com/console)
2. Create new app
3. Upload the `.aab` file
4. Complete store listing, screenshots, privacy policy
5. Submit for review

---

## 🔧 Capacitor Configuration (capacitor.config.ts)

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jobtrackr.app',
  appName: 'JobTrackr',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#6366f1',
      showSpinner: false,
    },
    LocalNotifications: {
      smallIcon: 'ic_notification',
      iconColor: '#6366f1',
    },
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#ffffff',
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
```

---

## 📋 Sample Data

Run the app → Settings → **Load Sample Data** to add 3 demo jobs including:
- A senior engineering role (Applied)
- A product manager opportunity (Wishlist)
- A rejected data analyst role with full lessons learned

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) file.

---

## 🌟 Roadmap

- [ ] Push notifications for deadline reminders
- [ ] CV/Cover letter file attachments
- [ ] Interview preparation notes
- [ ] LinkedIn profile import
- [ ] AI-powered cover letter suggestions
- [ ] Cloud sync (optional)
- [ ] Widget for Android home screen
- [ ] Barcode/QR code job link scanner
- [ ] Multi-language support

---

**Built with ❤️ for job seekers everywhere. Good luck with your search! 🚀**
