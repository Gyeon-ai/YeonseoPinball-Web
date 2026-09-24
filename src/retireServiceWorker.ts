export function retireServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    // 새 방문자에게 서비스워커를 등록하지 않는다. 기존 연서 핀볼 등록만
    // 갱신해 제거용 service-worker.js가 캐시를 정리하도록 한다.
    void navigator.serviceWorker
      .getRegistration('./')
      .then((registration) => registration?.update())
      .catch((error) => console.error('service worker retirement failed', error));
  });
}
