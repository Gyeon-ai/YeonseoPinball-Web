// 스트리머 그림(퍼스나콘 등) 암호화·복호화 공통 부분.
// 저장소에는 암호화된 *.png.enc 만 두고, 원본 PNG는 .gitignore로 뺀다.
// 사이트를 만들 때만 GitHub Actions가 비밀 값 PERSONACON_KEY로 풀어서 쓴다.
// 형식: "NWPC1"(5바이트) + IV(12) + 인증 태그(16) + 암호문. AES-256-GCM, 폴더 안 상대 경로를 추가 인증 데이터로 묶는다.
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** 잠그는 그림 폴더(저장소 기준). 하위 폴더까지 포함한다. */
export const PERSONACON_DIRS = ['assets/personacons'].map((dir) => resolve(ROOT, dir));
const MAGIC = Buffer.from('NWPC1');

export class KeyError extends Error {}

/** PERSONACON_KEY(32바이트를 base64로 적은 값)를 읽는다. 값은 어디에도 출력하지 않는다. */
export function readKey(env = process.env) {
  const text = (env.PERSONACON_KEY ?? '').trim();
  if (!text) throw new KeyError('PERSONACON_KEY 환경 변수가 없습니다.');
  const key = Buffer.from(text, 'base64');
  if (key.length !== 32) throw new KeyError('PERSONACON_KEY 형식이 틀렸습니다(32바이트 base64여야 합니다).');
  return key;
}

export function encrypt(key, name, plain) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(name));
  const body = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([MAGIC, iv, cipher.getAuthTag(), body]);
}

export function decrypt(key, name, data) {
  if (data.length < MAGIC.length + 28 || !data.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new KeyError(`${name}: 암호화 파일 형식이 아닙니다.`);
  }
  const iv = data.subarray(5, 17);
  const tag = data.subarray(17, 33);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAAD(Buffer.from(name));
  decipher.setAuthTag(tag);
  try {
    return Buffer.concat([decipher.update(data.subarray(33)), decipher.final()]);
  } catch {
    throw new KeyError(`${name}: 풀 수 없습니다. PERSONACON_KEY가 틀렸거나 파일이 손상됐습니다.`);
  }
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]
  );
}

/** 잠그는 폴더들 안에서 ext로 끝나는 파일 목록. name은 폴더 기준 상대 경로(/ 구분) */
export function listFiles(ext) {
  return PERSONACON_DIRS.flatMap((dir) =>
    walk(dir)
      .filter((file) => file.endsWith(ext))
      .map((file) => ({ dir, path: file, name: relative(dir, file).split(sep).join('/') }))
  ).sort((a, b) => a.path.localeCompare(b.path));
}

export function shortPath(file) {
  return relative(ROOT, file).split(sep).join('/');
}
