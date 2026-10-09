/**
 * Comprehensive Automated Test Suite for Porsche Configurator API
 * Verifies Auth, SQLite persistence, Business Rules, Compatibility, Orders, and Errors.
 */

import http from 'http';
import app from '../server/server.js';

const PORT = 3001;
process.env.PORT = PORT;

async function runTests() {
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(PORT, resolve));
    console.log(`Test server running on http://localhost:${PORT}\n`);

    const BASE_URL = `http://localhost:${PORT}/api`;
    let user1Token = '';
    let user2Token = '';
    let testPorscheCode = '';
    let testOrderNumber = '';
    let passed = 0;
    let failed = 0;

    function assert(condition, testName) {
        if (condition) {
            console.log(`[PASS] ${testName}`);
            passed++;
        } else {
            console.error(`[FAIL] ${testName}`);
            failed++;
        }
    }

    try {
        // 1. Health check
        const healthRes = await fetch(`${BASE_URL}/health`);
        const healthData = await healthRes.json();
        assert(healthRes.status === 200 && healthData.status === 'ok', 'GET /api/health -> 200 OK');

        // 2. Catalog check
        const catRes = await fetch(`${BASE_URL}/catalog`);
        const catData = await catRes.json();
        const hasMacanAndCayenne = catData.data.models.some(m => m.id === 'macan') && catData.data.models.some(m => m.id === 'cayenne');
        assert(catRes.status === 200 && catData.data.models.length >= 6 && hasMacanAndCayenne, 'GET /api/catalog -> 200 OK (contains 911, Macan, Cayenne, etc.)');

        // 3. Register User 1
        const timestamp = Date.now();
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: `testdriver_${timestamp}`,
                email: `driver_${timestamp}@porsche.de`,
                password: 'password123'
            })
        });
        const regData = await regRes.json();
        user1Token = regData.data ? regData.data.token : '';
        assert(regRes.status === 201 && user1Token, 'POST /api/auth/register -> 201 Created (Token received)');

        // 4. Duplicate Registration (Conflict)
        const dupRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: `testdriver_${timestamp}`,
                email: `driver_${timestamp}@porsche.de`,
                password: 'password123'
            })
        });
        const dupData = await dupRes.json();
        assert(dupRes.status === 409 && dupData.error.code === 'USER_EXISTS', 'POST /api/auth/register (duplicate) -> 409 Conflict');

        // 5. Register User 2 (for access control checks)
        const reg2Res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: `otherdriver_${timestamp}`,
                email: `other_${timestamp}@porsche.de`,
                password: 'password123'
            })
        });
        const reg2Data = await reg2Res.json();
        user2Token = reg2Data.data ? reg2Data.data.token : '';
        assert(reg2Res.status === 201 && user2Token, 'POST /api/auth/register (User 2) -> 201 Created');

        // 6. Login User 1
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identifier: `testdriver_${timestamp}`,
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        assert(loginRes.status === 200 && loginData.data.token, 'POST /api/auth/login -> 200 OK');

        // 7. Login with invalid password
        const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identifier: `testdriver_${timestamp}`,
                password: 'wrong_password'
            })
        });
        assert(badLoginRes.status === 401, 'POST /api/auth/login (bad password) -> 401 Unauthorized');

        // 8. Auth Me (Authorized)
        const meRes = await fetch(`${BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${user1Token}` }
        });
        const meData = await meRes.json();
        assert(meRes.status === 200 && meData.data.user.username === `testdriver_${timestamp}`, 'GET /api/auth/me (authorized) -> 200 OK');

        // 9. Auth Me (Unauthorized)
        const meNoAuthRes = await fetch(`${BASE_URL}/auth/me`);
        assert(meNoAuthRes.status === 401, 'GET /api/auth/me (no token) -> 401 Unauthorized');

        // 10. Create Valid Configuration for Porsche Macan GTS
        const createRes = await fetch(`${BASE_URL}/configurations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user1Token}`
            },
            body: JSON.stringify({
                title: 'My Custom Porsche Macan GTS',
                config: {
                    modelId: 'macan',
                    trimId: 'macan_gts',
                    colorId: 'paint_chalk',
                    wheelId: 'wheel_20_21_rs_spyder',
                    wheelFinishId: 'wf_satin_black',
                    caliperId: 'caliper_red',
                    interiorId: 'int_leather_bordeaux',
                    seatId: 'seat_adaptive_18way',
                    options: ['opt_sport_chrono', 'opt_bose'],
                    currency: 'USD'
                }
            })
        });
        const createData = await createRes.json();
        testPorscheCode = createData.porscheCode;
        assert(createRes.status === 201 && testPorscheCode && createData.data.pricing.totalPriceUSD > 90000,
            `POST /api/configurations (Macan GTS) -> 201 Created (Code: ${testPorscheCode})`);

        // 11. Create Incompatible Configuration (Carbon buckets + Seat ventilation) -> 422 Unprocessable Entity
        const conflictRes = await fetch(`${BASE_URL}/configurations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user1Token}`
            },
            body: JSON.stringify({
                config: {
                    modelId: '911',
                    trimId: '911_carrera_gts',
                    seatId: 'seat_full_bucket',
                    options: ['opt_seat_ventilation']
                }
            })
        });
        const conflictData = await conflictRes.json();
        assert(conflictRes.status === 422 && conflictData.error.code === 'COMPATIBILITY_CONFLICT' && conflictData.error.conflicts.length > 0,
            'POST /api/configurations (conflict options) -> 422 Unprocessable Entity (Business logic verified)');

        // 12. Get Configuration by Code (Public read)
        const getRes = await fetch(`${BASE_URL}/configurations/${testPorscheCode}`);
        const getData = await getRes.json();
        assert(getRes.status === 200 && getData.data.porscheCode === testPorscheCode && getData.data.config.modelId === 'macan',
            `GET /api/configurations/${testPorscheCode} -> 200 OK`);

        // 13. List User Configurations
        const listRes = await fetch(`${BASE_URL}/configurations?mine=true`, {
            headers: { 'Authorization': `Bearer ${user1Token}` }
        });
        const listData = await listRes.json();
        assert(listRes.status === 200 && listData.data.some(c => c.porscheCode === testPorscheCode),
            'GET /api/configurations?mine=true -> 200 OK (Lists saved configs)');

        // 14. Update Configuration by Owner
        const updateRes = await fetch(`${BASE_URL}/configurations/${testPorscheCode}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user1Token}`
            },
            body: JSON.stringify({
                title: 'Updated Macan GTS with Burmester',
                config: {
                    modelId: 'macan',
                    trimId: 'macan_gts',
                    colorId: 'paint_shark_blue',
                    wheelId: 'wheel_20_21_rs_spyder',
                    wheelFinishId: 'wf_satin_black',
                    caliperId: 'caliper_red',
                    interiorId: 'int_racetex_sport',
                    seatId: 'seat_adaptive_18way',
                    options: ['opt_sport_chrono', 'opt_burmester'],
                    currency: 'USD'
                }
            })
        });
        const updateData = await updateRes.json();
        assert(updateRes.status === 200 && updateData.data.config.colorId === 'paint_shark_blue',
            `PUT /api/configurations/${testPorscheCode} (by Owner) -> 200 OK`);

        // 15. Attempt Update by Another User (Forbidden 403)
        const updateForbiddenRes = await fetch(`${BASE_URL}/configurations/${testPorscheCode}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user2Token}`
            },
            body: JSON.stringify({
                title: 'Hacked Title',
                config: { modelId: 'macan', trimId: 'macan_gts' }
            })
        });
        assert(updateForbiddenRes.status === 403, `PUT /api/configurations/${testPorscheCode} (by other user) -> 403 Forbidden`);

        // 16. Place Order for Configuration
        const orderRes = await fetch(`${BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user1Token}`
            },
            body: JSON.stringify({
                porscheCode: testPorscheCode,
                dealerCity: 'Porsche Zentrum Stuttgart'
            })
        });
        const orderData = await orderRes.json();
        testOrderNumber = orderData.data ? orderData.data.order_number : '';
        assert(orderRes.status === 201 && testOrderNumber && orderData.data.status === 'pending',
            `POST /api/orders -> 201 Created (Order: ${testOrderNumber}, Status: pending)`);

        // 17. Verify Configuration status transitioned to 'ordered'
        const checkConfigRes = await fetch(`${BASE_URL}/configurations/${testPorscheCode}`);
        const checkConfigData = await checkConfigRes.json();
        assert(checkConfigData.data.status === 'ordered', `State Transition: configuration.status transitioned to 'ordered'`);

        // 18. Valid Order State Transition: pending -> confirmed
        const statusPatchRes = await fetch(`${BASE_URL}/orders/${testOrderNumber}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user1Token}`
            },
            body: JSON.stringify({ status: 'confirmed' })
        });
        const statusPatchData = await statusPatchRes.json();
        assert(statusPatchRes.status === 200 && statusPatchData.data.status === 'confirmed',
            `PATCH /api/orders/${testOrderNumber}/status -> 200 OK (pending -> confirmed)`);

        // 19. Invalid Order State Transition: confirmed -> completed (skipping in_production) -> 422
        const invalidPatchRes = await fetch(`${BASE_URL}/orders/${testOrderNumber}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user1Token}`
            },
            body: JSON.stringify({ status: 'completed' })
        });
        assert(invalidPatchRes.status === 422,
            `PATCH /api/orders/${testOrderNumber}/status (invalid skip transition) -> 422 Unprocessable Entity`);

        // 20. Delete Configuration
        const delRes = await fetch(`${BASE_URL}/configurations/${testPorscheCode}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${user1Token}` }
        });
        assert(delRes.status === 200, `DELETE /api/configurations/${testPorscheCode} -> 200 OK`);

        // 21. Verify 404 after deletion
        const notFoundRes = await fetch(`${BASE_URL}/configurations/${testPorscheCode}`);
        assert(notFoundRes.status === 404, `GET /api/configurations/${testPorscheCode} (after delete) -> 404 Not Found`);

        console.log(`\n=========================================`);
        console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
        console.log(`=========================================`);

        if (failed > 0) {
            process.exit(1);
        }
    } catch (err) {
        console.error('Unhandled test runner error:', err);
        process.exit(1);
    } finally {
        server.close();
    }
}

runTests();
