import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

// GitHub Pages의 같은 origin에는 다른 프로젝트의 캐시도 있을 수 있다.
// 연서 핀볼의 기존 Workbox precache만 골라서 제거한다.
const isYeonseoPinballCache = (key) => key.includes('/YeonseoPinball-Web/');

assert(
  isYeonseoPinballCache('workbox-precache-v2-https://gyeon-ai.github.io/YeonseoPinball-Web/'),
  '연서 핀볼의 기존 precache를 식별해야 한다'
);
assert(
  !isYeonseoPinballCache('workbox-precache-v2-https://gyeon-ai.github.io/another-project/'),
  '다른 GitHub Pages 프로젝트의 캐시는 보존해야 한다'
);

const killSwitch = `self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const isYeonseoPinballCache = ${isYeonseoPinballCache.toString()};
      const keys = await caches.keys();
      await Promise.all(keys.filter(isYeonseoPinballCache).map((key) => caches.delete(key)));

      const clients = await self.clients.matchAll({ type: 'window' });
      await self.registration.unregister();

      for (const client of clients) {
        client.navigate(client.url).catch(() => {});
      }
    })(),
  );
});
`;

writeFileSync('dist/service-worker.js', killSwitch);

// 제거 스크립트가 배포 결과에 계속 포함되는지 빌드 때 확인한다.
const html = readFileSync('dist/index.html', 'utf8');
const moduleScript = html.match(/<script type=module src=([^\s>]+)/)?.[1] ?? '';
assert(/\.[0-9a-f]{6,}\.js/.test(moduleScript), `해시 번들 확인 실패: ${moduleScript}`);

console.log('service worker retirement script generated');
