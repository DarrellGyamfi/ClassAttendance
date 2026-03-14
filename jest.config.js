module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native-firebase|@react-native|@react-navigation|react-native))',
  ],
  moduleNameMapper: {
    '^@react-native-firebase/(.*)$': '<rootDir>/__mocks__/@react-native-firebase/$1.js',
  },
};
