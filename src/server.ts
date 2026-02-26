import http from "http";
import app from "./app";
import { env } from "./config/env";

const PORT = Number(env.PORT) || 4000;

const server = http.createServer(app);

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 API server running on port ${PORT}`);
});

