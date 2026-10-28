package com.friendapp.nativeapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

enum class CallState { IDLE, SEARCHING, CONNECTED }

class MainActivity : ComponentActivity() {
    private val matchmaker = MatchmakingManager()
    private val currentUserId = "usr_normal_1" // Demo normal user

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            FriendAppTheme {
                MainScreen(matchmaker = matchmaker, userId = currentUserId)
            }
        }

        matchmaker.connect(currentUserId)
    }

    override fun onDestroy() {
        super.onDestroy()
        matchmaker.disconnect()
    }
}

@Composable
fun FriendAppTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            background = Color(0xFF020617),
            surface = Color(0xFF0F172A),
            primary = Color(0xFF10B981)
        ),
        content = content
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(matchmaker: MatchmakingManager, userId: String) {
    var selectedTab by remember { mutableStateOf(0) }
    var callState by remember { mutableStateOf(CallState.IDLE) }
    var peerName by remember { mutableStateOf("") }
    var currentRoomId by remember { mutableStateOf("") }
    var isMuted by remember { mutableStateOf(false) }

    // Wire callbacks
    LaunchedEffect(Unit) {
        matchmaker.onWaitingForPeer = {
            callState = CallState.SEARCHING
        }
        matchmaker.onMatchFound = { roomId, name, _ ->
            currentRoomId = roomId
            peerName = name
            callState = CallState.CONNECTED
        }
        matchmaker.onPeerLeft = {
            callState = CallState.IDLE
        }
        matchmaker.onCallEnded = {
            callState = CallState.IDLE
        }
    }

    Scaffold(
        bottomBar = {
            NavigationBar(containerColor = Color(0xFF0F172A)) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.Call, contentDescription = "Random Call") },
                    label = { Text("Call") }
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.Default.Event, contentDescription = "Events") },
                    label = { Text("Events") }
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(Icons.Default.Star, contentDescription = "Celebrities") },
                    label = { Text("Celebs") }
                )
                NavigationBarItem(
                    selected = selectedTab == 3,
                    onClick = { selectedTab = 3 },
                    icon = { Icon(Icons.Default.Headphones, contentDescription = "Support") },
                    label = { Text("Support") }
                )
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Color(0xFF020617))
        ) {
            when (selectedTab) {
                0 -> RandomCallScreen(
                    callState = callState,
                    peerName = peerName,
                    isMuted = isMuted,
                    onConnect = {
                        callState = CallState.SEARCHING
                        matchmaker.startMatchmaking(userId)
                    },
                    onCancel = {
                        callState = CallState.IDLE
                        matchmaker.cancelMatchmaking()
                    },
                    onSkip = {
                        callState = CallState.SEARCHING
                        matchmaker.skipFriend(currentRoomId, userId)
                    },
                    onEndCall = {
                        callState = CallState.IDLE
                        matchmaker.endCall(currentRoomId)
                    },
                    onToggleMute = { isMuted = !isMuted }
                )
                1 -> PlaceholderScreen(title = "Location-Based Events", subtitle = "Nearby events in Kochi & ticket booking")
                2 -> PlaceholderScreen(title = "Celebrity Connect", subtitle = "Audio/Video calls with verified stars")
                3 -> PlaceholderScreen(title = "Helpdesk Support", subtitle = "24/7 in-app chat & voice support")
            }
        }
    }
}

@Composable
fun RandomCallScreen(
    callState: CallState,
    peerName: String,
    isMuted: Boolean,
    onConnect: () -> Unit,
    onCancel: () -> Unit,
    onSkip: () -> Unit,
    onEndCall: () -> Unit,
    onToggleMute: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        when (callState) {
            CallState.IDLE -> {
                Text(
                    text = "Friend Connect",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = "തത്സമയം സുഹൃത്തുക്കളുമായി സംസാരിക്കൂ",
                    fontSize = 14.sp,
                    color = Color.Gray,
                    modifier = Modifier.padding(top = 4.dp, bottom = 48.dp)
                )

                Button(
                    onClick = onConnect,
                    modifier = Modifier
                        .size(160.dp)
                        .clip(CircleShape),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.Phone, contentDescription = "Call", modifier = Modifier.size(48.dp))
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("CONNECT", fontWeight = FontWeight.Bold)
                    }
                }
            }

            CallState.SEARCHING -> {
                CircularProgressIndicator(color = Color(0xFF10B981), modifier = Modifier.size(64.dp))
                Spacer(modifier = Modifier.height(24.dp))
                Text("Looking for a friend...", fontSize = 20.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                Spacer(modifier = Modifier.height(32.dp))
                OutlinedButton(onClick = onCancel) {
                    Text("Cancel", color = Color.White)
                }
            }

            CallState.CONNECTED -> {
                Text("CALL CONNECTED", color = Color(0xFF10B981), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                Spacer(modifier = Modifier.height(8.dp))
                Text(peerName, fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Spacer(modifier = Modifier.height(48.dp))

                Row(
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = onToggleMute,
                        modifier = Modifier
                            .size(56.dp)
                            .background(if (isMuted) Color.Red else Color(0xFF1E293B), CircleShape)
                    ) {
                        Icon(if (isMuted) Icons.Default.MicOff else Icons.Default.Mic, contentDescription = "Mute", tint = Color.White)
                    }

                    IconButton(
                        onClick = onEndCall,
                        modifier = Modifier
                            .size(68.dp)
                            .background(Color(0xFFDC2626), CircleShape)
                    ) {
                        Icon(Icons.Default.CallEnd, contentDescription = "End Call", tint = Color.White)
                    }

                    IconButton(
                        onClick = onSkip,
                        modifier = Modifier
                            .size(56.dp)
                            .background(Color(0xFF10B981), CircleShape)
                    ) {
                        Icon(Icons.Default.SkipNext, contentDescription = "Skip Friend", tint = Color.White)
                    }
                }
            }
        }
    }
}

@Composable
fun PlaceholderScreen(title: String, subtitle: String) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(title, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Spacer(modifier = Modifier.height(8.dp))
        Text(subtitle, fontSize = 14.sp, color = Color.Gray)
    }
}
