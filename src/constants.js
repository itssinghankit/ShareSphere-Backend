export const DB_NAME = "ShareSphereDB"

//common chat events
export const ChatEventEnum = Object.freeze({
    ESTABLISH_CONNECTION_EVENT: "connection",
    CONNECTED_EVENT: "connected",
    DISCONNECT_EVENT: "disconnect",
    JOIN_CHAT_EVENT: "join-chat",
    LEAVE_CHAT_EVENT: "leave-chat",
    UPDATE_GROUP_NAME_EVENT: "update-group-name",
    MESSAGE_RECEIVED_EVENT: "message-received",
    NEW_CHAT_EVENT: "new-chat",
    SOCKET_ERROR_EVENT: "socket-error",
    TYPING_EVENT: "typing",
    STOP_TYPING_EVENT: "stop-typing",
    MESSAGE_DELETE_EVENT: "message-delete"
})

//array of all chat events values
export const AvailableChatEvents = Object.values(ChatEventEnum)