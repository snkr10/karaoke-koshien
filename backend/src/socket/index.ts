import { Server } from "socket.io";
import { registerSessionHandlers } from "./session";
import { registerParticipantHandlers } from "./participant";
import { registerRoundHandlers } from "./round";
import { registerScoreHandlers } from "./score";

export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket) => {
    registerSessionHandlers(io, socket);
    registerParticipantHandlers(io, socket);
    registerRoundHandlers(io, socket);
    registerScoreHandlers(io, socket);
  });
}
