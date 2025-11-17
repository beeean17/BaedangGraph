# BaedangGraph
Dividend Chart Visualization - A comprehensive stock chart visualization application with dividend tracking and personal customization features.

## Features

### Core Functionality
- 📊 **Candlestick Chart Visualization**: Real-time stock price charts using professional charting library
- 💰 **Dividend Information Display**: Track dividend payments with dates and amounts
- 🔐 **User Authentication**: Secure login and signup with Firebase Authentication
- 📌 **Personal Price Reference Lines**: Add horizontal lines to mark your buy prices
- 🎨 **Customization**: Choose colors and labels for your reference lines
- 💾 **Cloud Storage**: All user data stored securely in Firebase Firestore

### Personal Features
- Add multiple price reference lines with custom labels
- Color-coded lines for easy identification
- Persistent storage - your data is saved across sessions
- Private to your account - other users can't see your lines
- Easy management - add, remove, and update lines with a few clicks

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Charts**: Lightweight Charts (by TradingView)
- **Styling**: CSS with modern responsive design

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Firebase account

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password provider
4. Create Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules (see below)
5. Get your Firebase configuration:
   - Go to Project Settings
   - Scroll to "Your apps" section
   - Copy the configuration values

### Firestore Security Rules

Set up these rules in your Firestore Database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/beeean17/BaedangGraph.git
cd BaedangGraph
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Add your Firebase configuration to `.env`:
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:5173`

## Usage

### First Time Setup
1. Open the application
2. Click "Sign Up" if you don't have an account
3. Enter your email and password
4. You'll be automatically logged in

### Using the Application
1. **View Stock Charts**: Select a stock symbol from the dropdown
2. **Add Price Lines**: 
   - Click "+ Add Line" in the Price Reference Lines section
   - Enter your buy price and a label
   - Choose a color
   - Click "Add Price Line"
3. **View Dividends**: Check the Dividend Information section for payment dates and amounts
4. **Manage Lines**: Remove or update your price lines as needed

## Data Structure

### User Document (Firestore)
```typescript
{
  uid: string,
  email: string,
  priceLines: [
    {
      id: string,
      price: number,
      label: string,
      color: string
    }
  ],
  preferences: {
    theme: 'light' | 'dark',
    defaultSymbol: string
  }
}
```

### Stock Data (Currently Sample Data)
```typescript
{
  time: string,      // ISO date format
  open: number,
  high: number,
  low: number,
  close: number,
  volume: number
}
```

### Dividend Data
```typescript
{
  date: string,      // ISO date format
  amount: number,
  currency: string
}
```

## Future Enhancements

- Real-time stock data integration (Alpha Vantage, Yahoo Finance API)
- More chart types (line, area, volume charts)
- Technical indicators (RSI, MACD, Moving Averages)
- Price alerts and notifications
- Export functionality (PDF, CSV)
- Dark mode theme
- Mobile app version
- Portfolio tracking
- Stock comparison tools

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready to be deployed to any static hosting service.

## Deployment

You can deploy this application to:
- Firebase Hosting
- Vercel
- Netlify
- GitHub Pages

Example for Firebase Hosting:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## Automated OHLCV Sync (GitHub Actions)

Firebase Spark 요금제에서는 Python Cloud Functions 배포가 불가능하기 때문에, 일별 OHLCV 수집 작업은 GitHub Actions 스케줄러(`.github/workflows/ohlcv-sync.yml`)로 실행됩니다. 매일 15:40 KST(UTC 06:40)에 워크플로가 실행되어 `cloud_function/functions/main.py`를 직접 호출합니다.

### 필요한 GitHub Secrets

| Secret 이름 | 설명 |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT` | Firestore에 쓰기 위한 Firebase 서비스 계정 JSON 전체 문자열 |
| `HANKOOK_APP_KEY` | 한국투자증권 API App Key |
| `HANKOOK_APP_SECRET` | 한국투자증권 API App Secret |
| `HANKOOK_BASE_URL` (선택) | 기본 API URL을 바꾸고 싶을 때 설정 |

Secrets를 추가한 뒤 워크플로를 활성화하면, Actions가 자동으로 종가 데이터를 Firestore에 적재합니다. 일정 변경이나 수동 실행은 GitHub Actions UI에서 조정할 수 있습니다.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues and questions, please open an issue on GitHub.
