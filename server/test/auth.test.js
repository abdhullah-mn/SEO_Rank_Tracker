import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import jwt from "jsonwebtoken";

const baseUrl = process.env.AUTH_TEST_BASE_URL || "http://localhost:5000";
const password = "Test-only-Password-123!";
const email = `jwt-test-${randomUUID()}@example.test`;

const request = async (path, options = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: { "content-type": "application/json", ...(options.headers || {}) },
    });
    let body = null;
    try {
        body = await response.json();
    } catch {
        // Empty responses, such as logout, are valid.
    }
    return { response, body };
};

const bearer = (token) => ({ authorization: `Bearer ${token}` });

test("JWT authentication and authorization flows", async (t) => {
    const registered = await request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name: "JWT Test User", email, password }),
    });
    assert.equal(registered.response.status, 201);
    assert.ok(registered.body.token);

    const token = registered.body.token;
    const login = await request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
    assert.equal(login.response.status, 200);
    assert.ok(login.body.token);
    assert.equal((await request("/api/auth/user", { headers: bearer(token) })).response.status, 200);
    assert.equal((await request("/api/auth/user")).response.status, 401);
    assert.equal((await request("/api/auth/user", { headers: bearer("not-a-jwt") })).response.status, 401);

    const updatedProfile = await request("/api/auth/user", {
        method: "PATCH",
        headers: bearer(token),
        body: JSON.stringify({ name: "Updated Test User", email: `updated-${email}`, plan: "pro", role: "admin" }),
    });
    assert.equal(updatedProfile.response.status, 200);
    assert.equal(updatedProfile.body.user.name, "Updated Test User");
    assert.equal(updatedProfile.body.user.email, `updated-${email}`);
    assert.equal(updatedProfile.body.user.plan, "free");
    assert.equal(updatedProfile.body.user.role, "user");
    assert.equal(updatedProfile.body.user.password, undefined);
    assert.equal((await request("/api/auth/user", { headers: bearer(token) })).body.user.email, `updated-${email}`);
    assert.equal((await request("/api/auth/user", { method: "PATCH", body: JSON.stringify({ name: "No token", email }) })).response.status, 401);

    const invalidProfile = await request("/api/auth/user", {
        method: "PATCH",
        headers: bearer(token),
        body: JSON.stringify({ name: "Updated Test User", email: "not-an-email" }),
    });
    assert.equal(invalidProfile.response.status, 400);

    const invalidLogin = await request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: "wrong-password" }),
    });
    assert.equal(invalidLogin.response.status, 400);
    assert.equal(invalidLogin.body.token, undefined);

    const expiredToken = jwt.sign(
        { tokenVersion: 0 },
        process.env.JWT_SECRET,
        { subject: "000000000000000000000000", algorithm: "HS256", issuer: "seo-rank-tracker-api", audience: "seo-rank-tracker-client", expiresIn: -1 },
    );
    assert.equal((await request("/api/auth/user", { headers: bearer(expiredToken) })).response.status, 401);

    const invalidSignature = jwt.sign(
        { tokenVersion: 0 },
        "wrong-test-secret-that-is-long-enough-123456",
        { subject: "000000000000000000000000", algorithm: "HS256", issuer: "seo-rank-tracker-api", audience: "seo-rank-tracker-client", expiresIn: "1h" },
    );
    assert.equal((await request("/api/auth/user", { headers: bearer(invalidSignature) })).response.status, 401);

    const wrongAlgorithm = jwt.sign(
        { tokenVersion: 0 },
        process.env.JWT_SECRET,
        { subject: "000000000000000000000000", algorithm: "HS512", issuer: "seo-rank-tracker-api", audience: "seo-rank-tracker-client", expiresIn: "1h" },
    );
    assert.equal((await request("/api/auth/user", { headers: bearer(wrongAlgorithm) })).response.status, 401);

    await t.test("protected resource ownership is scoped to the authenticated user", async () => {
        const secondEmail = `jwt-test-${randomUUID()}@example.test`;
        const second = await request("/api/auth/register", {
            method: "POST",
            body: JSON.stringify({ name: "JWT Test User 2", email: secondEmail, password }),
        });
        assert.equal(second.response.status, 201);
        const keyword = await request("/api/keywords", {
            method: "POST",
            headers: bearer(second.body.token),
            body: JSON.stringify({ keyword: `test-${randomUUID()}`, domain: "example.com", url: "https://example.com" }),
        });
        assert.equal(keyword.response.status, 201);
        assert.equal((await request(`/api/keywords/${keyword.body.keyword._id}`, { headers: bearer(token) })).response.status, 404);
    });

    const loggedOut = await request("/api/auth/logout", { method: "POST", headers: bearer(token) });
    assert.equal(loggedOut.response.status, 204);
    assert.equal((await request("/api/auth/user", { headers: bearer(token) })).response.status, 401);
});