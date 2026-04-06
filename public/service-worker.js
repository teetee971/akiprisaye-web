/* Compatibility SW wrapper: keeps legacy registration path working. */
/* eslint-disable no-restricted-globals */
const CANONICAL_SW_URL = new URL('./sw.js', self.registration.scope).toString();
importScripts(CANONICAL_SW_URL);
