import { AuthService } from '../services/auth.service';
import { MatchmakerService } from '../services/matchmaker.service';
import { EventService } from '../services/event.service';
import { CelebrityService } from '../services/celebrity.service';
import { SupportService } from '../services/support.service';
import { AdminService } from '../services/admin.service';
import { db } from '../db/inMemoryDb';

async function runBackendIntegrationTests() {
  console.log('🧪 ================= STARTING INTEGRATION TESTS ================= 🧪');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Auth Test
    console.log('\n--- 1. Testing Auth & OTP ---');
    const otpRes = AuthService.sendOtp('+919876500001');
    assert(otpRes.success === true && otpRes.testOtp === '123456', 'Send OTP generates 123456');

    const authRes = AuthService.verifyOtp('+919876500001', '123456');
    assert(!!authRes.token && authRes.user.phone === '+919876500001', 'Verify OTP generates valid JWT & User');

    // 2. Random Matchmaking Test
    console.log('\n--- 2. Testing Random Matchmaking Pairing ---');
    const socketId1 = 'socket_client_alpha';
    const socketId2 = 'socket_client_beta';
    const user1Id = 'usr_normal_1';
    const user2Id = 'usr_normal_2';

    // User 1 joins
    const match1 = MatchmakerService.enqueueUser(user1Id, socketId1);
    assert(match1 === null, 'First user enqueues and waits');
    assert(MatchmakerService.getQueueLength() === 1, 'Queue length is 1');

    // User 2 joins
    const match2 = MatchmakerService.enqueueUser(user2Id, socketId2);
    assert(match2 !== null, 'Second user enqueuing immediately produces a match!');
    assert(match2?.peerA.userId === user1Id && match2?.peerB.userId === user2Id, 'Correct peers matched in room');
    assert(match2?.session.status === 'CONNECTED', 'Call session marked CONNECTED');

    // End call test
    const ended = MatchmakerService.endRoom(match2!.roomId);
    assert(ended?.status === 'ENDED', 'Call ended cleanly and duration recorded');

    // 3. Location-Based Events Test
    console.log('\n--- 3. Testing Location-Based Events & Distance Filter ---');
    // Kochi coordinates: ~9.9816, 76.2999
    const kochiEvents = EventService.getEvents({ userLat: 9.9816, userLon: 76.2999, radiusKm: 25 });
    assert(kochiEvents.length > 0, 'Found Kochi events within 25km');
    assert(typeof kochiEvents[0].distanceKm === 'number' && kochiEvents[0].distanceKm < 25, 'Distance calculated accurately');

    // Ticket Booking
    const event = kochiEvents[0];
    const tier = event.ticketTiers[0];
    const booking = EventService.bookTicket({
      eventId: event.id,
      userId: user1Id,
      tierId: tier.id,
    });
    assert(booking.status === 'VALID' && booking.qrCodeToken.startsWith('TKT-'), 'Ticket booked with unique QR Token');

    // Ticket Check-in by Org
    const checkIn = EventService.verifyAndCheckInTicket(booking.qrCodeToken, event.organizationId);
    assert(checkIn.success === true, 'Organization verified and checked in ticket QR code');

    // 4. Celebrity Calling & Eligibility Test
    console.log('\n--- 4. Testing Celebrity Profiles & Calling ---');
    const celebs = CelebrityService.getAllCelebrities();
    assert(celebs.length > 0, 'Found registered celebrities');

    const celeb = celebs[0];
    // User1 has isPremium = true
    const eligible1 = CelebrityService.validateCallEligibility(user1Id, celeb.user.id);
    assert(eligible1.eligible === true, 'Premium user is eligible to call celebrity');

    // User2 has isPremium = false
    const eligible2 = CelebrityService.validateCallEligibility(user2Id, celeb.user.id);
    assert(eligible2.eligible === false, 'Non-premium user is correctly blocked with upgrade prompt');

    // 5. Customer Care Support Test
    console.log('\n--- 5. Testing Customer Care Live Tickets & Messaging ---');
    const ticket = SupportService.createTicket(user1Id, 'Need assistance with ticket refund');
    assert(ticket.status === 'OPEN', 'Support ticket created');

    const msg = SupportService.addMessage(ticket.id, 'usr_support_1', 'Hello Arjun, we are checking this for you.');
    const allMsgs = SupportService.getMessages(ticket.id);
    assert(allMsgs.length >= 2, 'Support message added and retrieved');

    // 6. Super Admin Stats Test
    console.log('\n--- 6. Testing Super Admin Statistics ---');
    const stats = AdminService.getPlatformStats();
    assert(stats.users.total >= 5, 'Stats reports all system users accurately');
    assert(stats.events.ticketsSold >= 1, 'Stats reports tickets sold');

    console.log('\n======================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('💥 Test execution error:', err);
    process.exit(1);
  }
}

runBackendIntegrationTests();
