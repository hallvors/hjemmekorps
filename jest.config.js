module.exports = {
  transform: {
    "^.+\\.svelte$": "jest-transform-svelte",
    "^.+\\.mjs$": "babel-jest",
    "^.+\\.js$": "babel-jest"
  },
  transformIgnorePatterns: [
    "src/node_modules/(?!@sapper)",
    "node_modules"
  ],
  moduleFileExtensions: ["js", "mjs", "svelte"],
  moduleDirectories: ["node_modules", "src/node_modules"],
  testPathIgnorePatterns: ["node_modules"],
  bail: false,
  verbose: true,
  setupFilesAfterEnv: ["@testing-library/jest-dom/extend-expect"],
};
