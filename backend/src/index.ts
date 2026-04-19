import http from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { registerSocketIO } from "./socket/registerSocketIO";

const app = createApp();
const server = http.createServer(app);

registerSocketIO(server);

server.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API + Socket.IO on http://localhost:${env.PORT}`);
});
