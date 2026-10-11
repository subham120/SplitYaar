const STORAGE_PREFIX = 'split_yaar_member_';
const GROUPS_KEY = 'split_yaar_groups';

/**
 * Get identity (memberId, memberName) for a specific group.
 */
export function getIdentity(code) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${code}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Set identity for a specific group.
 */
export function setIdentity(code, memberId, memberName) {
  localStorage.setItem(`${STORAGE_PREFIX}${code}`, JSON.stringify({ memberId, memberName }));
  addGroupToList(code);
}

/**
 * Clear identity for a specific group.
 */
export function clearIdentity(code) {
  localStorage.removeItem(`${STORAGE_PREFIX}${code}`);
  removeGroupFromList(code);
}

/**
 * Get all known group codes from localStorage.
 */
export function getAllGroups() {
  try {
    const raw = localStorage.getItem(GROUPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Add a group code to the tracked list.
 */
function addGroupToList(code) {
  const groups = getAllGroups();
  if (!groups.includes(code)) {
    groups.unshift(code);
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  }
}

/**
 * Remove a group from the tracked list.
 */
function removeGroupFromList(code) {
  const groups = getAllGroups().filter((g) => g !== code);
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
}

/**
 * Get auth token.
 */
export function getToken() {
  return localStorage.getItem('splityaar_token');
}

/**
 * Set auth token.
 */
export function setToken(token) {
  localStorage.setItem('splityaar_token', token);
}

/**
 * Clear auth token.
 */
export function clearToken() {
  localStorage.removeItem('splityaar_token');
}

/**
 * Get stored user profile.
 */
export function getUser() {
  try {
    const raw = localStorage.getItem('splityaar_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Set stored user profile.
 */
export function setUser(user) {
  localStorage.setItem('splityaar_user', JSON.stringify(user));
}

/**
 * Clear stored user.
 */
export function clearUser() {
  localStorage.removeItem('splityaar_user');
}
