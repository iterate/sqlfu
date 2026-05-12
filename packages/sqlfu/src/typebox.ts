type TypeBoxValidationError = {
  instancePath?: string;
  message?: string;
};

type TypeBoxParseError = {
  errors?: TypeBoxValidationError[];
};

type TypeBoxParser<T> = {
  Parse(value: unknown): T;
};

export function parseTypeBox<T>(parser: TypeBoxParser<T>, value: unknown): T {
  try {
    return parser.Parse(value);
  } catch (error) {
    throw new Error(prettifyTypeBoxError(error) || 'Validation failed', {cause: error});
  }
}

export function prettifyTypeBoxError(error: unknown): string | null {
  const errors = extractTypeBoxErrors(error);
  if (errors.length === 0) {
    return null;
  }

  return [
    'Validation failed:',
    ...errors.map((issue) => {
      const path = issue.instancePath || '/';
      const message = issue.message || 'invalid value';
      return `  ${path} ${message}`;
    }),
  ].join('\n');
}

function extractTypeBoxErrors(error: unknown): TypeBoxValidationError[] {
  if (!error || typeof error !== 'object') {
    return [];
  }
  const errors = (error as TypeBoxParseError).errors;
  return Array.isArray(errors) ? errors : [];
}
