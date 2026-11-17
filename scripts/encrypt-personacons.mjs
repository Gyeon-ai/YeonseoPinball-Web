// 원본 그림(*.png)을 같은 자리의 .png.enc 로 암호화한다(키: 환경 변수 PERSONACON_KEY).
// 사용: PERSONACON_KEY=... node scripts/encrypt-personacons.mjs
// 원본 PNG는 지우지 않는다(.gitignore로 저장소에서만 뺀다).
import { readFileSync, writeFileSync } from 'node:fs';
import { decrypt, encrypt, KeyError, listFiles, PERSONACON_DIRS, readKey } from './personacon-crypto.mjs';

try {
  const key = readKey();
  const files = listFiles('.png');
  if (files.length === 0) throw new KeyError(`${PERSONACON_DIRS.join(', ')}에 원본 PNG가 없습니다.`);
  for (const file of files) {
    const plain = readFileSync(file.path);
    const sealed = encrypt(key, file.name, plain);
    if (!decrypt(key, file.name, sealed).equals(plain)) throw new Error(`${file.name}: 암호화 확인 실패`);
    writeFileSync(`${file.path}.enc`, sealed);
  }
  console.log(`그림 ${files.length}장을 암호화했습니다.`);
} catch (error) {
  console.error(`[그림 암호화 실패] ${error.message}`);
  process.exit(1);
}
