# YNAB Monthly Averages

A simple app to calculate the monthly average of your YNAB transactions.

## Vue Application

### Setup

1. Clone the repo
2. Install dependencies: `npm install`
3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your YNAB API key to the `.env` file
4. Run the app: `npm run dev`

### Features

- Calculate monthly averages for your YNAB transactions
- View the results in a table
- Export the results to a CSV file

## Mac App (Tauri)

This project can be built and run as a native Mac desktop app using [Tauri](https://tauri.app/).

### Prerequisites
- Node.js
- Rust
- Xcode Command Line Tools

Install Rust (if not already):
```
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Install Xcode Command Line Tools (if not already):
```
xcode-select --install
```

### Development (hot reload)
In one terminal, run the Vite dev server:
```
npm run dev
```

In another terminal, run the Tauri dev app:
```
npx tauri dev
```

This opens a Mac app window that hot-reloads with your Vite frontend.

### Building a Mac App (Production)
First, build your Vite app:
```
npm run build
```
Then, build the Tauri app:
```
npx tauri build
```
The final `.app` bundle will be in `src-tauri/target/release/bundle/macos/`.

### Notes
- All Tauri configuration is in `src-tauri/tauri.conf.json`.
- You can customize the app icon and other native options in `src-tauri/`.
- For more, see the [Tauri docs](https://tauri.app/v1/guides/getting-started/prerequisites/).
