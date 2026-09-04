import { execa } from "execa";

export type CommandResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut?: boolean;
  isCanceled?: boolean;
  isTerminated?: boolean;
};

export type CommandOptions = {
  input: string;
  shell: false;
  timeout: number;
};

export type CommandExecutor = (
  file: string,
  args: string[],
  options: CommandOptions,
) => Promise<CommandResult>;

export type CodexProcessRequest = {
  prompt: string;
  model: string;
  reasoningEffort?: string;
  fixtureDirectory: string;
  timeoutMs: number;
};

export type CodexProcessResult = {
  status: "completed" | "failed" | "timeout" | "interrupted";
  exitCode: number;
  output: string;
  stderr: string;
};

const executeCommand: CommandExecutor = async (file, args, options) => {
  const result = await execa(file, args, {
    input: options.input,
    reject: false,
    shell: options.shell,
    timeout: options.timeout,
  });
  return {
    exitCode: result.exitCode ?? 1,
    stdout: result.stdout,
    stderr: result.stderr,
    timedOut: result.timedOut,
    isCanceled: result.isCanceled,
    isTerminated: result.isTerminated,
  };
};

const parseJsonLines = (contents: string): Record<string, unknown>[] =>
  contents
    .split(/\r?\n/u)
    .filter((line) => line.trim() !== "")
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as Record<string, unknown>];
      } catch {
        return [];
      }
    });

const readAgentOutput = (events: Record<string, unknown>[]): string => {
  const messages = events.flatMap((event) => {
    if (event.type !== "item.completed" || typeof event.item !== "object") {
      return [];
    }
    const item = event.item as Record<string, unknown>;
    return item.type === "agent_message" && typeof item.text === "string"
      ? [item.text]
      : [];
  });
  return messages.at(-1) ?? "";
};

const errorField = (error: unknown, key: string) =>
  typeof error === "object" && error !== null && key in error
    ? (error as Record<string, unknown>)[key]
    : undefined;

const errorText = (error: unknown, key: string) => {
  const value = errorField(error, key);
  return typeof value === "string" ? value : "";
};

const statusFor = (
  result: Pick<
    CommandResult,
    "exitCode" | "timedOut" | "isCanceled" | "isTerminated"
  >,
): CodexProcessResult["status"] => {
  if (result.timedOut) {
    return "timeout";
  }
  if (result.isCanceled || result.isTerminated) {
    return "interrupted";
  }
  return result.exitCode === 0 ? "completed" : "failed";
};

export async function executeCodexPrompt(
  request: CodexProcessRequest,
  execute: CommandExecutor = executeCommand,
): Promise<CodexProcessResult> {
  const args = [
    "exec",
    "--ephemeral",
    "--json",
    "--model",
    request.model,
    "--sandbox",
    "read-only",
    "--cd",
    request.fixtureDirectory,
  ];
  if (request.reasoningEffort) {
    args.push("-c", `model_reasoning_effort=${request.reasoningEffort}`);
  }
  args.push("-");

  try {
    const result = await execute("codex", args, {
      input: request.prompt,
      shell: false,
      timeout: request.timeoutMs,
    });
    return {
      status: statusFor(result),
      exitCode: result.exitCode,
      output: readAgentOutput(parseJsonLines(result.stdout)),
      stderr: result.stderr,
    };
  } catch (error) {
    const timedOut = errorField(error, "timedOut") === true;
    const isCanceled = errorField(error, "isCanceled") === true;
    const isTerminated = errorField(error, "isTerminated") === true;
    if (!timedOut && !isCanceled && !isTerminated) {
      throw error;
    }
    const exitCode = errorField(error, "exitCode");
    return {
      status: timedOut ? "timeout" : "interrupted",
      exitCode: typeof exitCode === "number" ? exitCode : 1,
      output: readAgentOutput(parseJsonLines(errorText(error, "stdout"))),
      stderr: errorText(error, "stderr"),
    };
  }
}
