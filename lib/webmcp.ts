export type GameToolAPI = {
  state: () => unknown;
  visit: (id: string) => Promise<unknown>;
};
type RegisteredTool = {
  name: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => unknown;
};
type Registry = {
  registerTool: (
    tool: RegisteredTool,
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};
export function registerGameTools(
  context: Registry | undefined,
  api: GameToolAPI,
) {
  if (!context?.registerTool) return () => {};
  const lifecycle = new AbortController();
  const tools: RegisteredTool[] = [
    {
      name: 'get_monster_game_state',
      description:
        'Read the current learning area, activity, stars and introduced sounds.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => api.state(),
    },
    {
      name: 'visit_monster_learning_area',
      description:
        'Move Monster to an island learning area and enter exploration. This does not answer or complete an activity.',
      inputSchema: {
        type: 'object',
        properties: {
          area: { type: 'string', enum: ['meadow', 'woods', 'cove', 'garden'] },
        },
        required: ['area'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input) => {
        if (!input || typeof input !== 'object' || Array.isArray(input))
          throw new Error('Expected an area.');
        const value = input as Record<string, unknown>;
        if (
          Object.keys(value).length !== 1 ||
          !['meadow', 'woods', 'cove', 'garden'].includes(String(value.area))
        )
          throw new Error('Choose meadow, woods, cove or garden.');
        return api.visit(String(value.area));
      },
    },
  ];
  for (const tool of tools) {
    try {
      void Promise.resolve(
        context.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {
      /* Optional on browsers without stable WebMCP support. */
    }
  }
  return () => lifecycle.abort();
}
