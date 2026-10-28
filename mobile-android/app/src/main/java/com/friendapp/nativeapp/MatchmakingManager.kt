package com.friendapp.nativeapp

import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import java.net.URI

class MatchmakingManager(private val serverUrl: String = "http://10.0.2.2:4000") {
    private var socket: Socket? = null
    var onWaitingForPeer: ((String) -> Unit)? = null
    var onMatchFound: ((roomId: String, peerName: String, isInitiator: Boolean) -> Unit)? = null
    var onPeerLeft: ((String) -> Unit)? = null
    var onCallEnded: (() -> Unit)? = null

    fun connect(userId: String) {
        try {
            val uri = URI.create(serverUrl)
            socket = IO.socket(uri)

            socket?.on(Socket.EVENT_CONNECT) {
                Log.d("Matchmaker", "Socket connected to $serverUrl")
                val regData = JSONObject().put("userId", userId)
                socket?.emit("register-user", regData)
            }

            socket?.on("waiting-for-peer") { args ->
                val data = args[0] as? JSONObject
                val msg = data?.optString("message") ?: "Searching for friend..."
                onWaitingForPeer?.invoke(msg)
            }

            socket?.on("match-found") { args ->
                val data = args[0] as? JSONObject ?: return@on
                val roomId = data.getString("roomId")
                val isInitiator = data.getBoolean("isInitiator")
                val peer = data.getJSONObject("peer")
                val peerName = peer.optString("name", "Anonymous Friend")
                onMatchFound?.invoke(roomId, peerName, isInitiator)
            }

            socket?.on("peer-left") { args ->
                val data = args.getOrNull(0) as? JSONObject
                val reason = data?.optString("reason") ?: "Peer disconnected."
                onPeerLeft?.invoke(reason)
            }

            socket?.on("call-ended") {
                onCallEnded?.invoke()
            }

            socket?.connect()
        } catch (e: Exception) {
            Log.e("Matchmaker", "Connection error", e)
        }
    }

    fun startMatchmaking(userId: String) {
        val json = JSONObject().put("userId", userId)
        socket?.emit("join-matchmaking", json)
    }

    fun cancelMatchmaking() {
        socket?.emit("cancel-matchmaking")
    }

    fun skipFriend(roomId: String, userId: String) {
        val json = JSONObject().put("roomId", roomId).put("userId", userId)
        socket?.emit("skip-friend", json)
    }

    fun endCall(roomId: String) {
        val json = JSONObject().put("roomId", roomId)
        socket?.emit("end-call", json)
    }

    fun disconnect() {
        socket?.disconnect()
    }
}
