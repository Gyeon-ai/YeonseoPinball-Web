// 순위 목록에서 당첨된 이름 앞에 붙는 표시. 이모지(👑) 대신 직접 그린 분홍 보석 왕관(2026-10-14 사용자 선택).
// 운영체제마다 모양이 다른 이모지와 달리 어디서나 같은 모양으로 보인다.

const LINE = '#3d2228';

/** (x, y)를 가운데로 size 크기의 왕관을 그린다 */
export function drawWinnerMark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  if (typeof ctx.fill !== 'function') return; // 도형을 그릴 수 없는 그림판(자동 검사용 가짜)에서는 건너뛴다
  const s = size / 16; // 16 기준으로 그린 모양을 키운다
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.4 * s;
  ctx.strokeStyle = LINE;
  ctx.beginPath();
  ctx.moveTo(-7 * s, 5 * s);
  ctx.lineTo(-7.5 * s, -4 * s);
  ctx.lineTo(-3.5 * s, 0);
  ctx.lineTo(0, -6.5 * s);
  ctx.lineTo(3.5 * s, 0);
  ctx.lineTo(7.5 * s, -4 * s);
  ctx.lineTo(7 * s, 5 * s);
  ctx.closePath();
  ctx.fillStyle = '#ffcd4a';
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ef8189';
  for (const [dx, dy, r] of [[0, 1.8, 1.8], [-4, 2.5, 1.1], [4, 2.5, 1.1]]) {
    ctx.beginPath();
    ctx.arc(dx * s, dy * s, r * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
