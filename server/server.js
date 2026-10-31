const http = require("http");
require("./config/env");
const { connectDb, disconnectDb } = require("./config/dbConfig");
const createApp = require("./app");
const { initRealtime, closeRealtime } = require("./utils/realtime");
const { seedDemoData } = require("./seed");

const port = process.env.PORT || 5050;

const start = async () => {
  const { isLocal } = await connectDb();
  if (isLocal) {
    await seedDemoData();
  }
  const httpServer = http.createServer(createApp());
  initRealtime(httpServer);
  httpServer.listen(port, () =>
    console.log(`Node JS server listening on port ${port}`)
  );

  const shutdown = async () => {
    await closeRealtime();
    await disconnectDb();
    process.exit(0);
  };
  ["SIGINT", "SIGTERM", "SIGUSR2"].forEach((signal) =>
    process.once(signal, shutdown)
  );
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
