const path = require("path");

module.exports = {
  turbopack: {
    // explicitly set the project root so Next doesn't guess the wrong folder
    root: path.resolve(__dirname)
  }
};
