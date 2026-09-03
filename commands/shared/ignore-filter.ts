const HIDDEN_FILE_ALLOWLIST = new Set([
  '.editorconfig',
  '.gitignore',
  '.prettierignore',
  '.prettierrc',
  '.cursorignore',
  '.npmrc',
  '.nvmrc',
  '.tool-versions',
  '.env.example',
]);

export type FilterEntry = {
  name: string;
  relativePosix: string;
  isDirectory: boolean;
};

function compileIgnorePattern(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
    .replace(/\*\*/g, '::DOUBLE_STAR::')
    .replace(/\*/g, '[^/]*')
    .replace(/::DOUBLE_STAR::/g, '.*');

  return new RegExp(`^(?:${escaped}|.*/${escaped})$`);
}

export class IgnoreFilter {
  private readonly gitIgnoreCache = new Map<string, boolean>();
  private readonly gitTrackedCache = new Map<string, boolean>();
  private readonly extraIgnoreRegexes: RegExp[];

  constructor(
    private readonly workspaceRoot: string,
    private readonly respectGitignore: boolean,
    private readonly excludeHidden: boolean,
    extraIgnore: string[],
    private readonly forcedIncludePrefix: string | null,
  ) {
    this.extraIgnoreRegexes = extraIgnore.map(compileIgnorePattern);
  }

  shouldIgnore(entry: FilterEntry): boolean {
    if (entry.name === '.git') {
      return true;
    }

    if (this.excludeHidden && entry.name.startsWith('.')) {
      if (entry.isDirectory) {
        return true;
      }

      if (!HIDDEN_FILE_ALLOWLIST.has(entry.name)) {
        return true;
      }
    }

    if (
      this.extraIgnoreRegexes.some((regex) => regex.test(entry.relativePosix))
    ) {
      return true;
    }

    if (
      this.forcedIncludePrefix !== null &&
      (entry.relativePosix === this.forcedIncludePrefix ||
        entry.relativePosix.startsWith(`${this.forcedIncludePrefix}/`))
    ) {
      return false;
    }

    if (!this.respectGitignore) {
      return false;
    }

    const cached = this.gitIgnoreCache.get(entry.relativePosix);

    if (cached !== undefined) {
      return cached;
    }

    const proc = Bun.spawnSync({
      cmd: ['git', 'check-ignore', '--quiet', '--', entry.relativePosix],
      cwd: this.workspaceRoot,
      stdout: 'ignore',
      stderr: 'ignore',
    });

    const ignored = proc.exitCode === 0 && !this.isTracked(entry.relativePosix);
    this.gitIgnoreCache.set(entry.relativePosix, ignored);

    return ignored;
  }

  private isTracked(relativePosix: string): boolean {
    const cached = this.gitTrackedCache.get(relativePosix);

    if (cached !== undefined) {
      return cached;
    }

    const proc = Bun.spawnSync({
      cmd: ['git', 'ls-files', '--error-unmatch', '--', relativePosix],
      cwd: this.workspaceRoot,
      stdout: 'ignore',
      stderr: 'ignore',
    });

    const tracked = proc.exitCode === 0;
    this.gitTrackedCache.set(relativePosix, tracked);

    return tracked;
  }
}
