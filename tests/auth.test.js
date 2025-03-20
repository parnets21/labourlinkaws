const request = require('supertest');
const app = require('../app');
const User = require('../Model/User');

describe('Authentication Tests', () => {
    const testUser = {
        email: 'test@example.com',
        password: 'password123',
        role: 'employee',
        firstName: 'Test',
        lastName: 'User',
        phone: '1234567890'
    };

    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(res.statusCode).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.token).toBeDefined();
            expect(res.body.data.user.email).toBe(testUser.email);
        });

        it('should not register user with existing email', async () => {
            await User.create(testUser);

            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(res.statusCode).toBe(400);
            expect(res.body.status).toBe('fail');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await User.create(testUser);
        });

        it('should login with correct credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.token).toBeDefined();
        });

        it('should not login with incorrect password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toBe(401);
            expect(res.body.status).toBe('fail');
        });
    });
});
