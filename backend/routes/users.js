const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../db/pool');
const jwt = require('jsonwebtoken');
const { tryKeycloakPasswordLogin, mapRealmRolesToAppRole } = require('../services/keycloakAuth');
const { verifyKeycloakAccessToken } = require('../services/keycloakJwtVerify');

const router = express.Router();

const VALID_ROLES = ['farmer', 'bank', 'admin', 'super'];
const SALT_ROUNDS = 10;

/**
 * POST /users – register a new user
 * Body: { username, password, role }
 */
router.post('/users', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: username, password, role',
      });
    }

    const normalizedUsername = String(username).trim().toLowerCase();
    if (normalizedUsername.length > 50) {
      return res.status(400).json({ success: false, error: 'Username too long' });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Allowed: ${VALID_ROLES.join(', ')}`,
      });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (username, password_hash, role, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING _id, username, role, created_at`,
      [normalizedUsername, password_hash, role]
    );

    const user = result.rows[0];
    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'Username already exists' });
    }
    console.error('POST /users error:', err);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

/**
 * POST /login – authenticate user
 * Body: { username, password, role } (role optional; can be used to restrict by role)
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing username or password',
      });
    }

    const normalizedUsername = String(username).trim().toLowerCase();

    const kc = await tryKeycloakPasswordLogin(username, password, role);
    if (kc) {
      if (kc.type === 'success') {
        return res.json({
          success: true,
          user: kc.user,
          token: kc.token,
        });
      }
      if (kc.type === 'role_mismatch') {
        return res.status(403).json({
          success: false,
          error: kc.message || 'Role does not match Keycloak assignment',
        });
      }
      if (kc.type === 'invalid_credentials') {
        // Fall through to local DB (user may exist only in Postgres)
      } else if (kc.type === 'unavailable') {
        console.warn('[Login] Keycloak unavailable, trying local users:', kc.message);
        // Fall through to local DB
      }
    }

    const result = await pool.query(
      `SELECT _id, username, password_hash, role, status, last_login
       FROM users
       WHERE username = $1`,
      [normalizedUsername]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, error: 'Account is not active' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        error: `This account does not have the selected role (${role})`,
      });
    }

    await pool.query(
      `UPDATE users SET last_login = now(), updated_at = now() WHERE _id = $1`,
      [user._id]
    );

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      token: jwt.sign(
        { sub: String(user._id), role: user.role, username: user.username },
        process.env.JWT_SECRET || 'dev-secret',
        { expiresIn: '2h' }
      ),
    });
  } catch (err) {
    console.error('POST /login error:', err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

/**
 * POST /auth/keycloak-session
 * Exchange Keycloak access token (browser OIDC) for app JWT.
 */
router.post('/auth/keycloak-session', async (req, res) => {
  try {
    const accessToken = req.body && req.body.accessToken;
    const intendedRole = req.body && req.body.intendedRole;

    if (!accessToken || typeof accessToken !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing accessToken' });
    }

    let payload;
    try {
      payload = await verifyKeycloakAccessToken(accessToken);
    } catch (err) {
      console.error('Keycloak JWT verify failed:', err && err.message ? err.message : err);
      return res.status(401).json({ success: false, error: 'Invalid Keycloak token' });
    }

    const realmRoles = (payload.realm_access && payload.realm_access.roles) || [];
    const appRole = mapRealmRolesToAppRole(realmRoles);

    if (!appRole) {
      return res.status(403).json({
        success: false,
        error:
          'User has no OpenAgriNet realm roles (need one of: super, admin, bank, farmer).',
      });
    }

    if (intendedRole && String(intendedRole) !== appRole) {
      return res.status(403).json({
        success: false,
        error: `Keycloak role (${appRole}) does not match selected portal role (${intendedRole}).`,
      });
    }

    const username =
      (payload.preferred_username && String(payload.preferred_username).toLowerCase()) ||
      (payload.email && String(payload.email).toLowerCase()) ||
      String(payload.sub);

    const user = {
      id: payload.sub,
      username,
      role: appRole,
      source: 'keycloak-browser',
    };

    const token = jwt.sign(
      {
        sub: String(payload.sub),
        role: appRole,
        username,
        source: 'keycloak-browser',
      },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '2h' }
    );

    return res.json({ success: true, user, token });
  } catch (err) {
    console.error('POST /auth/keycloak-session error:', err);
    return res.status(500).json({ success: false, error: 'Session exchange failed' });
  }
});

module.exports = router;
