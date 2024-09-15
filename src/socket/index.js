import { verifyJWTSocket } from "../middlewares/auth.middleware.js"
import { ChatEventEnum } from "../constants.js"
import ApiError from "../utils/ApiError.js"

const initializeSocketIO = (io) => {
    return io.on(ChatEventEnum.ESTABLISH_CONNECTION_EVENT, async (socket) => {
        try {
            // verify authenticity of user - passed by reference by default
            await verifyJWTSocket(socket)

            // We are creating a room with user id so that if user is joined but does not have any active chat going on still we want to emit some socket events to the user. so that the client can catch the event and show the notifications.
            socket.join(socket.user._id.toString());
            socket.emit(ChatEventEnum.CONNECTED_EVENT, socket.user._id); // emit the connected event so that client is aware
            console.log("User connected 🗼. userId: ", socket.user._id.toString());

            // user disconnected
            socket.on(ChatEventEnum.DISCONNECT_EVENT, () => {
                console.log("user has disconnected 🚫. userId: " + socket.user?._id);
                if (socket.user?._id) {
                    socket.leave(socket.user._id);
                }
            })

        } catch (error) {
            socket.emit(ChatEventEnum.SOCKET_ERROR_EVENT, new ApiError(error.status, error.message, error))
        }
    })
}

//to emit events from controllers
const emitSocketEvent = (req, roomId, event, payload) => {
    req.app.get("io").in(roomId).emit(event, payload)
}

export { initializeSocketIO, emitSocketEvent }