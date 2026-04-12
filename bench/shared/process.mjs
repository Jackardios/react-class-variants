import { execFileSync } from 'node:child_process';

export function runExecFile(command, args, options = {}) {
  try {
    return execFileSync(command, args, {
      cwd: options.cwd,
      encoding: options.encoding ?? 'utf8',
      env: {
        ...process.env,
        ...(options.env ?? {}),
      },
      input: options.input,
      stdio: options.stdio ?? 'pipe',
    });
  } catch (error) {
    const stdout = error.stdout?.toString?.() ?? '';
    const stderr = error.stderr?.toString?.() ?? '';

    throw new Error(
      [
        `${command} ${args.join(' ')} failed.`,
        stdout && `stdout:\n${stdout}`,
        stderr && `stderr:\n${stderr}`,
      ]
        .filter(Boolean)
        .join('\n\n')
    );
  }
}
