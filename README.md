# GRE Prep

A personal **GRE vocabulary & math** flashcard app built for daily spaced-repetition revision. Runs as a Progressive Web App (PWA) and can be packaged as an **Android APK** via Capacitor.

Every word and math technique you learn — whether added today or months ago — is available on the home screen as **random flashcard revision**, so nothing ever gets left behind.

![Technologies](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwindcss&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-119EFF?logo=capacitor&logoColor=white)
![Dexie](https://img.shields.io/badge/Dexie_IndexedDB-9C27B0?logo=indexeddb&logoColor=white)

---

## Features

### 🏠 Home — random flashcard revision
- **Learn Today** — two tabs:
  - **Added today**: cards you created today.
  - **Reviewed today**: cards you reviewed today.
- **Learn Overall** — every card ever added, drawn at random.
- Tap a card to flip it and see the answer. Use **Prev / Next / 🔀 Shuffle** to browse. Pure revision — no pressure to rate.

### 🗓 Spaced repetition (SM-2)
- Classic SM-2 scheduler (the algorithm behind Anki / SuperMemo).
- Rate each card **Again / Hard / Good / Easy** — intervals, ease factor and repetition counts update automatically.
- Due cards are surfaced in the **Review** tab, sorted by due date.

### 📝 Quiz mode
- Generates a multiple-choice quiz from your vocab (word → definition with distractor definitions) and typed-answer math questions.
- Does not affect review scheduling.

### 🎯 Weak spots
- Cards you've struggled with (Again / Hard history) are scored and drilled first, with recent struggles weighted more heavily.

### 🗂 Library
- Browse, search, edit, and delete all cards.
- Export your data as a JSON backup.

### 📱 Anything-else
- 🔥 Daily streak tracking.
- ⏰ Daily reminder notifications (browser).
- 🌙 Dark mode.
- 📲 Installs anywhere (PWA) or as a native Android APK.

---

## Tech Stack

| Layer      | Technology                                                        |
| ---------- | ----------------------------------------------------------------- |
| UI         | React 19 + TypeScript                                             |
| Build      | Vite 8                                                            |
| Styling    | Tailwind CSS 4 (dark-mode variant)                                |
| Routing    | react-router-dom (HashRouter)                                     |
| Storage    | Dexie 4 (IndexedDB) — `entries` + `reviews` tables                |
| SRS        | Custom SM-2 scheduler (`src/data/sm2.ts`, fully unit-tested)      |
| Mobile     | Capacitor 8 (native `android/` project → `.apk`)                  |
| PWA        | vite-plugin-pwa (offline + install prompt)                        |
| Lint/Tests | Oxlint · Vitest                                                   |

---

## Getting Started

```bash
npm install        # install dependencies
npm run dev        # start dev server (Vite HMR)
```

Open the printed URL in your browser (best experienced on a phone-sized viewport).

### Scripts

| Command          | What it does                              |
| ---------------- | ----------------------------------------- |
| `npm run dev`    | Start the Vite dev server                 |
| `npm run build`  | Type-check + build production bundle      |
| `npm run preview`| Preview the production build              |
| `npm run lint`   | Run Oxlint                                |
| `npm run test`   | Run Vitest unit tests (SM-2 scheduler)    |

---

## Building the Android APK

The app wraps the PWA in a native WebView via **Capacitor**.

```bash
npm run build            # 1. build the web app (dist/)
npx cap sync android     # 2. deploy dist/ into the android project
# 3. build the APK (see JDK note below)
```

From the `android/` folder:

```bash
./gradlew.bat assembleDebug
```

The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.

> **JDK requirement:** Capacitor 8 / Android Gradle Plugin requires **JDK 21+**.
> The build machine previously only had Java 8, so the APK build fails with
> `invalid source release: 21`. Install Temurin JDK 21 (or later) and make sure
> `JAVA_HOME` points to it before running Gradle.

---

## Project Structure

```
src/
├── App.tsx                  # Router + bottom navigation shell
├── main.tsx                 # React entry + service worker
├── index.css                # Tailwind + 3D flashcard flip CSS
├── components/
│   ├── Flashcard.tsx        # Rating flashcard (Review page)
│   ├── HomeFlashcard.tsx    # View-only flip card (Home page)
│   ├── AddWordForm.tsx      # Vocab capture form
│   ├── AddMathForm.tsx      # Math concept capture form
│   └── ...                  # Theme, reminder, install prompt, splash
├── pages/
│   ├── Home.tsx             # Learn Today + Learn Overall revision
│   ├── Add.tsx              # Quick-add (word / math)
│   ├── Review.tsx           # SRS review session
│   ├── Library.tsx          # Browse / edit / export
│   ├── WeakSpots.tsx        # Drill weak cards
│   └── Quiz.tsx             # Generated quiz
├── data/
│   ├── db.ts                # Dexie schema
│   ├── repo.ts              # Data access layer
│   └── sm2.ts               # SM-2 spaced-repetition scheduler
├── hooks/
│   ├── useReviewQueue.ts    # Due-card queue
│   └── useDuplicateDetection.ts
└── types/index.ts           # All data models
```

---

## Data Model

- **Entries** — vocab words and math techniques (word/title, definition/technique, example, synonyms/antonyms, tags, `dateAdded`).
- **Reviews** — per-card SRS state (`easeFactor`, `interval`, `repetitions`, `nextDueDate`, rating `history`).

Both live in IndexedDB (`gre-prep` database) and are fully offline.