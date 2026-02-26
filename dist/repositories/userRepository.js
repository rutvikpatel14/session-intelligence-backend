"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = void 0;
const client_1 = require("../prisma/client");
exports.userRepository = {
    findByEmail(email) {
        return client_1.prisma.user.findUnique({ where: { email } });
    },
    findById(id) {
        return client_1.prisma.user.findUnique({ where: { id } });
    },
    create(data) {
        return client_1.prisma.user.create({ data });
    },
};
