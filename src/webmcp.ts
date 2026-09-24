type ToolRegistration = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute(input: unknown): unknown | Promise<unknown>;
};

type ModelContext = {
  registerTool(tool: ToolRegistration, options?: { signal?: AbortSignal }): void | Promise<void>;
};

type WebMcpDocument = Document & { modelContext?: ModelContext };

function namesInput(): HTMLTextAreaElement {
  const input = document.querySelector<HTMLTextAreaElement>('#in_names');
  if (!input) throw new Error('참가자 입력란을 찾을 수 없습니다.');
  return input;
}

export function registerPinballTools(): void {
  const context = (document as WebMcpDocument).modelContext;
  if (!context?.registerTool) return;

  const lifecycle = new AbortController();
  const register = (tool: ToolRegistration) => {
    void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch((error) => {
      console.warn('[WebMCP] 도구 등록 실패', error);
    });
  };

  register({
    name: 'configure_pinball_names',
    title: '핀볼 명단 설정',
    description: '연서 핀볼의 참가자 명단을 한 번에 설정하고 공을 다시 섞습니다.',
    inputSchema: {
      type: 'object',
      properties: {
        names: {
          type: 'array',
          minItems: 1,
          maxItems: 200,
          items: { type: 'string', minLength: 1, maxLength: 80 },
        },
      },
      required: ['names'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      const candidate = input as { names?: unknown };
      if (!Array.isArray(candidate?.names)) throw new Error('names는 문자열 배열이어야 합니다.');
      const names = candidate.names.map((name) => String(name).trim()).filter(Boolean);
      if (names.length === 0 || names.length > 200) throw new Error('명단은 1개 이상 200개 이하여야 합니다.');
      const field = namesInput();
      field.value = names.join('\n');
      field.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector<HTMLButtonElement>('#btnShuffle')?.click();
      return { configured: true, count: names.length };
    },
  });

  register({
    name: 'start_pinball',
    title: '핀볼 시작',
    description: '현재 화면에 설정된 명단으로 연서 핀볼 경기를 시작합니다.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute() {
      if (!namesInput().value.trim()) throw new Error('먼저 한 개 이상의 이름을 설정하세요.');
      document.querySelector<HTMLButtonElement>('#btnStart')?.click();
      return { started: true };
    },
  });
}
