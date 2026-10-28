import SwiftUI

enum AppCallState {
    case idle
    case searching
    case connected
}

struct ContentView: View {
    @State private var selectedTab = 0
    @State private var callState: AppCallState = .idle
    @State private var peerName = "Anonymous Friend"
    @State private var isMuted = false
    @State private var callDuration = 0
    @State private var timer: Timer? = nil

    var body: some View {
        TabView(selection: $selectedTab) {
            // Tab 1: Random Call
            RandomCallTab(
                callState: $callState,
                peerName: peerName,
                isMuted: $isMuted,
                callDuration: callDuration,
                onConnect: {
                    callState = .searching
                    // Simulate server matchmaking
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                        peerName = "Arjun Das"
                        callState = .connected
                        startTimer()
                    }
                },
                onCancel: {
                    callState = .idle
                },
                onSkip: {
                    callState = .searching
                    stopTimer()
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                        peerName = "Ananya Nair"
                        callState = .connected
                        startTimer()
                    }
                },
                onEndCall: {
                    callState = .idle
                    stopTimer()
                }
            )
            .tabItem {
                Label("Random Call", systemImage: "phone.fill")
            }
            .tag(0)

            // Tab 2: Events
            EventsTab()
                .tabItem {
                    Label("Events", systemImage: "calendar")
                }
                .tag(1)

            // Tab 3: Celebrities
            CelebritiesTab()
                .tabItem {
                    Label("Celebrities", systemImage: "star.fill")
                }
                .tag(2)

            // Tab 4: Helpdesk
            SupportTab()
                .tabItem {
                    Label("Helpdesk", systemImage: "headphones")
                }
                .tag(3)
        }
        .accentColor(Color(red: 16/255, green: 185/255, blue: 129/255))
        .preferredColorScheme(.dark)
    }

    private func startTimer() {
        callDuration = 0
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            callDuration += 1
        }
    }

    private func stopTimer() {
        timer?.invalidate()
        timer = nil
        callDuration = 0
    }
}

// ================= 1. RANDOM CALL TAB =================
struct RandomCallTab: View {
    @Binding var callState: AppCallState
    let peerName: String
    @Binding var isMuted: Bool
    let callDuration: Int
    let onConnect: () -> Void
    let onCancel: () -> Void
    let onSkip: () -> Void
    let onEndCall: () -> Void

    var body: some View {
        ZStack {
            Color(red: 2/255, green: 6/255, blue: 23/255).edgesIgnoringSafeArea(.all)

            VStack(spacing: 30) {
                Spacer()

                switch callState {
                case .idle:
                    VStack(spacing: 8) {
                        Text("Friend Connect")
                            .font(.system(size: 32, weight: .bold))
                            .foregroundColor(.white)
                        Text("തത്സമയം പുതിയ ആളുകളുമായി സംസാരിക്കൂ")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                    }

                    Spacer()

                    Button(action: onConnect) {
                        VStack(spacing: 12) {
                            Image(systemName: "phone.circle.fill")
                                .resizable()
                                .frame(width: 72, height: 72)
                            Text("CONNECT")
                                .font(.headline)
                                .fontWeight(.heavy)
                        }
                        .foregroundColor(.white)
                        .frame(width: 180, height: 180)
                        .background(
                            LinearGradient(
                                colors: [Color.emerald, Color.teal],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .clipShape(Circle())
                        .shadow(color: Color.emerald.opacity(0.4), radius: 20, x: 0, y: 10)
                    }

                    Spacer()

                case .searching:
                    ProgressView()
                        .scaleEffect(2.0)
                        .progressViewStyle(CircularProgressViewStyle(tint: Color.emerald))
                    Text("Searching for a friend...")
                        .font(.title3)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)

                    Button(action: onCancel) {
                        Text("Cancel")
                            .font(.subheadline)
                            .foregroundColor(.white)
                            .padding(.horizontal, 24)
                            .padding(.vertical, 10)
                            .background(Color.slate800)
                            .cornerRadius(20)
                    }

                case .connected:
                    VStack(spacing: 16) {
                        HStack(spacing: 6) {
                            Circle()
                                .fill(Color.emerald)
                                .frame(width: 8, height: 8)
                            Text("LIVE CALL • \(formatTime(callDuration))")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(Color.emerald)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 6)
                        .background(Color.emerald.opacity(0.1))
                        .cornerRadius(20)

                        Image(systemName: "person.crop.circle.fill")
                            .resizable()
                            .frame(width: 100, height: 100)
                            .foregroundColor(.emerald)

                        Text(peerName)
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)

                        // In-Call Controls
                        HStack(spacing: 24) {
                            Button(action: { isMuted.toggle() }) {
                                Image(systemName: isMuted ? "mic.slash.fill" : "mic.fill")
                                    .font(.title2)
                                    .foregroundColor(.white)
                                    .frame(width: 60, height: 60)
                                    .background(isMuted ? Color.red.opacity(0.3) : Color.slate800)
                                    .clipShape(Circle())
                            }

                            Button(action: onEndCall) {
                                Image(systemName: "phone.down.fill")
                                    .font(.title)
                                    .foregroundColor(.white)
                                    .frame(width: 72, height: 72)
                                    .background(Color.red)
                                    .clipShape(Circle())
                            }

                            Button(action: onSkip) {
                                Image(systemName: "forward.fill")
                                    .font(.title2)
                                    .foregroundColor(.white)
                                    .frame(width: 60, height: 60)
                                    .background(Color.emerald)
                                    .clipShape(Circle())
                            }
                        }
                        .padding(.top, 40)
                    }
                }

                Spacer()
            }
            .padding()
        }
    }

    private func formatTime(_ s: Int) -> String {
        let mins = s / 60
        let secs = s % 60
        return String(format: "%02d:%02d", mins, secs)
    }
}

// ================= PLACEHOLDER TABS =================
struct EventsTab: View {
    var body: some View {
        VStack {
            Text("Nearby Events")
                .font(.title2).bold()
            Text("Find concerts and book QR tickets")
                .foregroundColor(.gray)
        }
    }
}

struct CelebritiesTab: View {
    var body: some View {
        VStack {
            Text("Celebrities")
                .font(.title2).bold()
            Text("Call stars on audio & video")
                .foregroundColor(.gray)
        }
    }
}

struct SupportTab: View {
    var body: some View {
        VStack {
            Text("Customer Care Helpdesk")
                .font(.title2).bold()
            Text("In-app live chat & voice calling")
                .foregroundColor(.gray)
        }
    }
}

extension Color {
    static let emerald = Color(red: 16/255, green: 185/255, blue: 129/255)
    static let slate800 = Color(red: 30/255, green: 41/255, blue: 59/255)
}
