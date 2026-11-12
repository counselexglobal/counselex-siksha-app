const STREAMS_PART1 = require("./streams-part1");
const STREAMS_PART2 = require("./streams-part2");
const HOMEPAGE_DATA = require("./homepage");

const STREAMS_DATA = {
  ...STREAMS_PART1,
  ...STREAMS_PART2
};

module.exports = {
  STREAMS_DATA,
  HOMEPAGE_DATA
};
