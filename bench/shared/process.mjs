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
  } catch (caught) {
    const error =
      /** @type {{ stdout?: Buffer | string; stderr?: Buffer | string }} */ (
        caught
      );
    const stdout = String(error.stdout ?? '');
    const stderr = String(error.stderr ?? '');

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
