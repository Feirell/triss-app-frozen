const {Logger} = require("@triss/logger");

exports.createAgent = function createAgent() {
  const logger = new Logger("EXAMPLE-EXP-AGENT");
  logger.log("This is the example-exp-agent!");

  return class ExampleExpAgent {

    constructor() {
      logger.log("Crated a ExampleExpAgent instance");
    }

    getExportedAgentData(forEntities) {
      return [];
    }

    handleFrame(args) {
      const {world, frameNumber, simulationTime, deltaMs} = args;

      if (frameNumber % 20 === 0)
        logger.log("Was asked to crate frame #" + frameNumber);

      return world;
    }
  };
};
