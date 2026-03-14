# Class Attendance App Setup Instructions

This document provides comprehensive setup instructions for the Class Attendance App, a React Native application integrated with Firebase for authentication, database, and analytics.

## Prerequisites

Before setting up the project, ensure you have the following installed on your development machine:

### System Requirements
- **Node.js**: Version 16 or higher (recommended: LTS version). Download from [nodejs.org](https://nodejs.org/).
- **React Native CLI**: Install globally using npm:
  ```bash
  npm install -g @react-native-community/cli
  ```
- **Watchman** (recommended for better performance on macOS/Linux):
  - macOS: `brew install watchman`
  - Linux: Follow instructions at [facebook.github.io/watchman](https://facebook.github.io/watchman/docs/install/)
  - Windows: Not required, but optional

### Android Development
- **Android Studio**: Latest stable version. Download from [developer.android.com/studio](https://developer.android.com/studio).
  - During installation, ensure you install:
    - Android SDK
    - Android SDK Platform
    - Android Virtual Device
- **Java Development Kit (JDK)**: Version 11 or higher. Android Studio usually includes this.
- **Android SDK**: API level 31 or higher
- Set up environment variables:
  - `ANDROID_HOME`: Path to Android SDK (usually `~/Android/Sdk` on macOS/Linux, `C:\Users\<username>\AppData\Local\Android\Sdk` on Windows)
  - Add `platform-tools` to PATH: `$ANDROID_HOME/platform-tools`

### iOS Development (macOS only)
- **Xcode**: Version 12 or higher. Download from Mac App Store.
- **Command Line Tools**: Install via Xcode > Preferences > Locations > Command Line Tools
- **CocoaPods**: Ruby dependency manager for iOS. Install with:
  ```bash
  sudo gem install cocoapods
  ```

### Additional Tools
- **Git**: For version control
- **Yarn** (optional, but recommended): `npm install -g yarn`

## Installation Steps

1. **Clone or navigate to the project directory**:
   ```bash
   cd ClassAttendanceApp
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```
   Or if using Yarn:
   ```bash
   yarn install
   ```

3. **iOS Setup (macOS only)**:
   ```bash
   cd ios
   pod install
   cd ..
   ```
   This installs iOS dependencies via CocoaPods.

4. **Android Setup**:
   - Open Android Studio and ensure the Android SDK is properly configured.
   - The project includes the necessary Android configuration files.

## Firebase Project Setup

The app uses Firebase for authentication, Firestore database, and analytics. Follow these steps to set up Firebase:

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project" or "Add project"
   - Enter project name (e.g., "ClassAttendanceApp")
   - Enable Google Analytics if desired
   - Choose Google Analytics account or create new
   - Click "Create project"

2. **Enable Required Services**:
   - In Firebase Console, go to your project
   - **Authentication**:
     - Go to Authentication > Sign-in method
     - Enable Email/Password and Google sign-in
   - **Firestore Database**:
     - Go to Firestore Database > Create database
     - Choose "Start in test mode" for development (secure rules for production)
   - **Storage** (if needed for file uploads):
     - Go to Storage > Get started
   - **Analytics** (optional but recommended):
     - Already enabled if you chose Google Analytics during project creation

3. **Download Configuration Files**:
   - **For Android**:
     - In Firebase Console, click the Android icon to add an Android app
     - Package name: `com.classattendanceapp` (check `android/app/build.gradle` for exact name)
     - Download `google-services.json`
     - Place the file in `android/app/`
   - **For iOS**:
     - In Firebase Console, click the iOS icon to add an iOS app
     - Bundle ID: Check `ios/ClassAttendanceApp/Info.plist` for exact bundle ID
     - Download `GoogleService-Info.plist`
     - Place the file in `ios/ClassAttendanceApp/`

4. **Update Firebase Configuration**:
   - Open `firebaseConfig.js`
   - Replace the placeholder values with your Firebase project configuration:
     ```javascript
     const firebaseConfig = {
       apiKey: "your-api-key",
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project-id",
       storageBucket: "your-project.appspot.com",
       messagingSenderId: "123456789",
       appId: "1:123456789:web:abcdef123456"
     };
     ```
   - You can find these values in Firebase Console > Project settings > General > Your apps

## Environment Configuration

1. **Environment Variables** (if applicable):
   - The app uses Firebase configuration directly in `firebaseConfig.js`
   - For additional environment variables, create a `.env` file in the root directory:
     ```
     API_URL=https://your-api-endpoint.com
     DEBUG=true
     ```
   - Install `react-native-dotenv` if needed: `npm install react-native-dotenv`

2. **Permissions**:
   - **Android**: Permissions are declared in `android/app/src/main/AndroidManifest.xml`
     - Camera permission for QR scanning
     - Internet permission for Firebase
   - **iOS**: Permissions are declared in `ios/ClassAttendanceApp/Info.plist`
     - Camera usage description
     - Privacy descriptions for data usage

## Build and Run Instructions

### Android
1. **Start Metro bundler**:
   ```bash
   npm start
   ```

2. **Run on Android device/emulator**:
   ```bash
   npx react-native run-android
   ```
   - Ensure an Android device is connected or an emulator is running
   - First run may take longer due to Gradle build

### iOS (macOS only)
1. **Start Metro bundler** (if not already running):
   ```bash
   npm start
   ```

2. **Run on iOS simulator**:
   ```bash
   npx react-native run-ios
   ```
   - Opens iOS Simulator automatically
   - For physical device: Connect iPhone and select it in Xcode

### General Commands
- **Clean build**:
  ```bash
  cd android && ./gradlew clean && cd ..
  npx react-native start --reset-cache
  ```
- **Run tests**:
  ```bash
  npm test
  ```

## Troubleshooting

### Common Issues

1. **Metro bundler issues**:
   - Clear cache: `npx react-native start --reset-cache`
   - Delete node_modules and reinstall: `rm -rf node_modules && npm install`

2. **Android build failures**:
   - Ensure Android SDK is properly installed
   - Check JAVA_HOME: `echo $JAVA_HOME`
   - Clean Gradle: `cd android && ./gradlew clean`
   - Invalidate Android Studio cache

3. **iOS build failures**:
   - Clean CocoaPods: `cd ios && pod deintegrate && pod install`
   - Clean Xcode: Product > Clean Build Folder
   - Check Xcode command line tools: `xcode-select -p`

4. **Firebase connection issues**:
   - Verify `google-services.json` and `GoogleService-Info.plist` are in correct locations
   - Check Firebase project configuration matches `firebaseConfig.js`
   - Ensure internet connectivity

5. **Permission denied errors**:
   - Android: Check device permissions in Settings > Apps
   - iOS: Check app permissions and Info.plist entries

### Performance Tips
- Use Hermes engine for better performance (enabled by default in newer React Native versions)
- Enable ProGuard for release builds
- Use Flipper for debugging: `npm install -g flipper`

### Additional Resources
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Android Setup](https://reactnative.dev/docs/environment-setup?platform=android)
- [iOS Setup](https://reactnative.dev/docs/environment-setup?platform=ios)

For any issues not covered here, check the project's GitHub issues or consult the React Native community.