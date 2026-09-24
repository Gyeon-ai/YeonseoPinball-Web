# 연서 핀볼

유연서 구독 퍼스나콘 공을 물리 엔진으로 굴려 당첨자를 뽑는 방송용 웹 핀볼이다. 원본 [Marble Roulette](https://github.com/lazygyu/roulette)를 기반으로 하며 서버나 데이터베이스 없이 정적 파일만으로 동작한다.

- 웹사이트: https://gyeon-ai.github.io/YeonseoPinball-Web/
- GitHub: https://github.com/Gyeon-ai/YeonseoPinball-Web

## 주요 기능

- 쉼표 또는 줄바꿈으로 최대 200개 후보 입력
- `이름*3` 형식으로 같은 후보의 공 개수 지정
- `이름/3` 형식으로 공 무게 지정
- 첫 번째, 마지막 또는 지정 순위 당첨자 선택
- 여러 핀볼 맵과 경기 중 `1x`·`2x`·`5x` 배속
- 유연서 구독 퍼스나콘 7종을 이름별로 고정 배정
- 당첨자 확정 후 직접 시작하는 카운트다운 타이머
- `?names=이름1,이름2` URL 매개변수로 명단 자동 입력
- 브라우저 로컬 저장 및 배포 시 최신 버전 자동 반영

기본 참가자는 `유연서,연근단,핀볼`이다.

## 실행과 빌드

Node.js 20 이상과 pnpm이 필요하다.

```powershell
pnpm install
pnpm dev
pnpm build
```

개발 주소는 `http://localhost:1235`이며, 정적 배포 파일은 `dist` 폴더에 생성된다. 빌드할 때 `LICENSE`와 `NOTICE.md`도 배포 결과에 함께 복사된다.

## 수집기 연결

Windows 수집기의 `PinballUrl`에 배포 주소를 넣으면 기존 `?names=` 명단 전달 기능을 사용할 수 있다.

## 이미지와 라이선스

핀볼 엔진은 [Marble Roulette](https://github.com/lazygyu/roulette)를 기반으로 하며 소스코드는 [MIT License](LICENSE)를 따른다. `Marble Roulette`와 `마블 룰렛` 명칭은 원본 프로젝트를 식별하기 위해서만 사용한다.

유연서 구독 퍼스나콘은 MIT License 적용 대상이 아니며 각 이미지의 권리는 해당 권리자에게 있다. 제3자 구성요소와 이미지 사용 범위는 [NOTICE.md](NOTICE.md)를 확인한다.
