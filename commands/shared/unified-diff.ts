type DiffOperation = {
  type: 'equal' | 'add' | 'delete';
  line: string;
};

type LocatedOperation = DiffOperation & {
  oldLine: number;
  newLine: number;
};

function lines(value: string): string[] {
  const normalized = value.replace(/\r\n/g, '\n').replace(/\n$/, '');

  return normalized.length === 0 ? [] : normalized.split('\n');
}

function diffOperations(
  existing: string | null,
  proposed: string,
): DiffOperation[] {
  const oldLines = existing === null ? [] : lines(existing);
  const newLines = lines(proposed);
  const width = newLines.length;
  const directions = new Uint8Array(oldLines.length * width);
  let previous = new Uint32Array(width + 1);

  for (let oldIndex = 0; oldIndex < oldLines.length; oldIndex++) {
    const current = new Uint32Array(width + 1);

    for (let newIndex = 0; newIndex < width; newIndex++) {
      const directionIndex = oldIndex * width + newIndex;

      if (oldLines[oldIndex] === newLines[newIndex]) {
        current[newIndex + 1] = previous[newIndex]! + 1;
        directions[directionIndex] = 0;
      } else if (previous[newIndex + 1]! >= current[newIndex]!) {
        current[newIndex + 1] = previous[newIndex + 1]!;
        directions[directionIndex] = 1;
      } else {
        current[newIndex + 1] = current[newIndex]!;
        directions[directionIndex] = 2;
      }
    }

    previous = current;
  }

  const operations: DiffOperation[] = [];
  let oldIndex = oldLines.length;
  let newIndex = newLines.length;

  while (oldIndex > 0 || newIndex > 0) {
    if (oldIndex === 0) {
      operations.push({ type: 'add', line: newLines[newIndex - 1]! });
      newIndex--;
      continue;
    }

    if (newIndex === 0) {
      operations.push({ type: 'delete', line: oldLines[oldIndex - 1]! });
      oldIndex--;
      continue;
    }

    const direction = directions[(oldIndex - 1) * width + newIndex - 1];

    if (direction === 0 && oldLines[oldIndex - 1] === newLines[newIndex - 1]) {
      operations.push({ type: 'equal', line: oldLines[oldIndex - 1]! });
      oldIndex--;
      newIndex--;
    } else if (direction === 1) {
      operations.push({ type: 'delete', line: oldLines[oldIndex - 1]! });
      oldIndex--;
    } else {
      operations.push({ type: 'add', line: newLines[newIndex - 1]! });
      newIndex--;
    }
  }

  return operations.reverse();
}

function locateOperations(operations: DiffOperation[]): LocatedOperation[] {
  let oldLine = 1;
  let newLine = 1;

  return operations.map((operation) => {
    const located = { ...operation, oldLine, newLine };

    if (operation.type !== 'add') {
      oldLine++;
    }

    if (operation.type !== 'delete') {
      newLine++;
    }

    return located;
  });
}

function hunkRanges(
  operations: LocatedOperation[],
  context: number,
): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];

  for (let index = 0; index < operations.length; index++) {
    if (operations[index]?.type === 'equal') {
      continue;
    }

    const start = Math.max(0, index - context);
    const end = Math.min(operations.length, index + context + 1);
    const previous = ranges.at(-1);

    if (previous && start <= previous.end) {
      previous.end = Math.max(previous.end, end);
    } else {
      ranges.push({ start, end });
    }
  }

  return ranges;
}

function hunkHeader(operations: LocatedOperation[]): string {
  const first = operations[0]!;

  const oldCount = operations.filter(
    (operation) => operation.type !== 'add',
  ).length;

  const newCount = operations.filter(
    (operation) => operation.type !== 'delete',
  ).length;

  const oldStart =
    oldCount === 0 ? Math.max(0, first.oldLine - 1) : first.oldLine;

  const newStart =
    newCount === 0 ? Math.max(0, first.newLine - 1) : first.newLine;

  return `@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`;
}

export function createUnifiedDiff(params: {
  relativePath: string;
  existing: string | null;
  proposed: string;
  context?: number;
}): string {
  const operations = locateOperations(
    diffOperations(params.existing, params.proposed),
  );

  const ranges = hunkRanges(operations, params.context ?? 3);

  if (ranges.length === 0) {
    return '';
  }

  return [
    `diff --git a/${params.relativePath} b/${params.relativePath}`,
    `--- ${params.existing === null ? '/dev/null' : `a/${params.relativePath}`}`,
    `+++ b/${params.relativePath}`,
    ...ranges.flatMap((range) => {
      const hunk = operations.slice(range.start, range.end);

      return [
        hunkHeader(hunk),
        ...hunk.map((operation) => {
          const prefix =
            operation.type === 'add'
              ? '+'
              : operation.type === 'delete'
                ? '-'
                : ' ';

          return `${prefix}${operation.line}`;
        }),
      ];
    }),
  ].join('\n');
}
