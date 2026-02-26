"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const PORT = Number(env_1.env.PORT) || 4000;
const server = http_1.default.createServer(app_1.default);
server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 API server running on port ${PORT}`);
});
