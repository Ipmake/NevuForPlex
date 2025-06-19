import { CheckPlexUser } from "./plex";
import { remoteIo as io } from "..";
import { PerPlexed } from "../types";

io?.on('connection', async (socket) => {
    console.log(`REMOTE [${socket.id}] connected`);

    if (!socket.handshake.query.deviceID) {
        console.log(`REMOTE [${socket.id}] disconnected: no deviceID provided`);
        socket.emit("conn-error", {
            type: 'invalid_query',
            message: 'No deviceID provided'
        } satisfies PerPlexed.Sync.SocketError);
        return setTimeout(() => socket.disconnect(), 1000);
    }

    if (!socket.handshake.auth.token) {
        console.log(`REMOTE [${socket.id}] disconnected: no token provided`);
        socket.emit("conn-error", {
            type: 'invalid_auth',
            message: 'No token provided'
        } satisfies PerPlexed.Sync.SocketError);
        return setTimeout(() => socket.disconnect(), 1000);
    }

    const user = await CheckPlexUser(socket.handshake.auth.token);
    if (!user) {
        console.log(`REMOTE [${socket.id}] disconnected: invalid token`);
        socket.emit("conn-error", {
            type: 'invalid_auth',
            message: 'Invalid token'
        } satisfies PerPlexed.Sync.SocketError);
        return setTimeout(() => socket.disconnect(), 1000);
    }

    socket.data.user = user;
    socket.data.deviceID = JSON.parse(socket.handshake.query.deviceID as string) as PerPlexed.Remote.DeviceID;

    socket.join("remote:" + user.uuid);

    console.log(`REMOTE [${socket.id}] authenticated as ${user.friendlyName} on ${socket.data.deviceID.friendlyName}`);

    socket.on("getDevices", (callback) => {
        callback(Array.from(io?.sockets.sockets.values())
            .filter(s => s.data.user && (s.data.user as PerPlexed.PlexTV.User).uuid === user.uuid && s.data.deviceID?.id !== socket.data.deviceID.id)
            .map(s => {
                const deviceID = s.data.deviceID as PerPlexed.Remote.DeviceID;
                return {
                    socket: s.id,
                    id: deviceID.id,
                    type: deviceID.type,
                    friendlyName: deviceID.friendlyName,
                    isControllable: deviceID.isControllable,
                    isRemote: deviceID.isRemote
                } satisfies PerPlexed.Remote.DeviceID;
            }));
    });

    socket.on("remoteAction", (action: PerPlexed.Remote.RemoteAction, callback) => {
        if (!action.target || !action.action) {
            return callback({ success: false, message: "Invalid action" });
        }

        const targetSocket = io?.sockets.sockets.get(action.target);
        if (!targetSocket) {
            return callback({ success: false, message: "Target device not found" });
        }

        targetSocket.emit("remoteAction", action);
        callback({ success: true, message: "Action sent" });
    });

    socket.on("mediaState", (state: PerPlexed.Sync.PlayBackState) => {
        io.to("remote:" + user.uuid).emit(`mediaState:${socket.id}`, {
            ...state,
            deviceID: socket.data.deviceID
        });
    });

    socket.on("disconnect", () => {
        console.log(`REMOTE [${socket.id}] disconnected`);
    });
});