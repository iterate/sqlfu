const sqlTemplateTagPattern = /\bsql(?:\.\w+)?(?:<[^`]*>)?`/g;

export function sqlTagShikiTransformer() {
  return {
    name: 'sqlfu-sql-tag-sql-highlighting',
    tokens(tokens) {
      const lang = this.options.lang || '';
      if (!['ts', 'tsx', 'typescript', 'javascript', 'js', 'jsx'].includes(lang)) {
        return;
      }
      if (!this.source.includes('sql`') && !this.source.includes('sql.')) {
        return;
      }

      const templateRanges = findSqlTemplateRanges(this.source);
      if (templateRanges.length === 0) {
        return;
      }

      const palette = inferPalette(tokens);
      const ranges = templateRanges.map((range) => ({
        ...range,
        sqlTokens: tokenizeSql(range.sql, range.start, palette),
      }));

      return tokens.map((line) => {
        const nextLine = [];
        for (const token of line) {
          nextLine.push(...retokenizeSqlTemplateToken(token, ranges));
        }
        return nextLine;
      });
    },
  };
}

function findSqlTemplateRanges(source) {
  const ranges = [];
  sqlTemplateTagPattern.lastIndex = 0;
  let match;
  while ((match = sqlTemplateTagPattern.exec(source))) {
    const templateStart = match.index + match[0].length;
    const templateEnd = findTemplateEnd(source, templateStart);
    if (templateEnd === -1) {
      continue;
    }
    ranges.push({
      start: templateStart,
      end: templateEnd,
      sql: source.slice(templateStart, templateEnd),
    });
    sqlTemplateTagPattern.lastIndex = templateEnd + 1;
  }
  return ranges;
}

function findTemplateEnd(source, start) {
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (char === '\\') {
      index += 1;
      continue;
    }
    if (char === '$' && source[index + 1] === '{') {
      return -1;
    }
    if (char === '`') {
      return index;
    }
  }
  return -1;
}

function retokenizeSqlTemplateToken(token, ranges) {
  const tokenStart = token.offset;
  const tokenEnd = token.offset + token.content.length;
  const overlappingRange = ranges.find((range) => tokenStart < range.end && tokenEnd > range.start);
  if (!overlappingRange) {
    return [token];
  }

  const nextTokens = [];
  let cursor = tokenStart;
  if (cursor < overlappingRange.start) {
    nextTokens.push(sliceToken(token, cursor, overlappingRange.start));
    cursor = overlappingRange.start;
  }

  for (const sqlToken of overlappingRange.sqlTokens) {
    const start = Math.max(sqlToken.offset, tokenStart, overlappingRange.start);
    const end = Math.min(sqlToken.offset + sqlToken.content.length, tokenEnd, overlappingRange.end);
    if (start >= end) {
      continue;
    }
    if (cursor < start) {
      nextTokens.push(sliceToken(token, cursor, start));
    }
    nextTokens.push(sliceToken(sqlToken, start, end));
    cursor = end;
  }

  const rangeEnd = Math.min(tokenEnd, overlappingRange.end);
  if (cursor < rangeEnd) {
    nextTokens.push(sliceToken(token, cursor, rangeEnd));
    cursor = rangeEnd;
  }
  if (cursor < tokenEnd) {
    nextTokens.push(sliceToken(token, cursor, tokenEnd));
  }
  return nextTokens.filter((nextToken) => nextToken.content.length > 0);
}

function sliceToken(token, start, end) {
  return {
    ...token,
    content: token.content.slice(start - token.offset, end - token.offset),
    offset: start,
  };
}

function inferPalette(lines) {
  const tokens = lines.flat();
  const keywordToken = tokens.find((token) => ['const', 'import', 'export', 'from'].includes(token.content.trim()));
  const defaultToken =
    tokens.find((token) => token.content.includes(';')) ||
    tokens.find((token) => token.content.trim() === '') ||
    tokens.find((token) => token.content.trim() !== '=');
  return {
    keywordColor: keywordToken?.color,
    defaultColor: defaultToken?.color,
    fontStyle: keywordToken?.fontStyle || defaultToken?.fontStyle || 0,
  };
}

function tokenizeSql(sql, offset, palette) {
  const tokens = [];
  const tokenPattern =
    /\b(?:select|from|where|insert|into|values|update|set|delete|create|table|alter|add|column|primary|key|not|null|default|order|by|limit|returning|on|conflict|do)\b|[=(),;]/giu;
  let cursor = 0;
  let match;
  while ((match = tokenPattern.exec(sql))) {
    if (cursor < match.index) {
      tokens.push(sqlToken(sql.slice(cursor, match.index), offset + cursor, palette.defaultColor, palette.fontStyle));
    }
    const content = match[0];
    tokens.push(
      sqlToken(
        content,
        offset + match.index,
        /^[a-z]/iu.test(content) ? palette.keywordColor : palette.defaultColor,
        palette.fontStyle,
      ),
    );
    cursor = match.index + content.length;
  }
  if (cursor < sql.length) {
    tokens.push(sqlToken(sql.slice(cursor), offset + cursor, palette.defaultColor, palette.fontStyle));
  }
  return tokens;
}

function sqlToken(content, offset, color, fontStyle) {
  return {
    content,
    offset,
    color,
    fontStyle,
  };
}
