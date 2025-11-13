// Simple markdown to HTML converter for basic markdown features
export const markdownToHtml = (markdown: string): string => {
  let html = markdown;

  // Process tables first (before other replacements)
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inTable = false;
  let tableRows: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTableRow = line.trim().startsWith('|') && line.trim().endsWith('|');
    const isTableSeparator = /^\|[\s\-:]+\|/.test(line.trim());

    if (isTableRow && !isTableSeparator) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
        processedLines.push(
          '<table class="border-collapse border border-gray-300 dark:border-gray-600 w-full my-4">',
        );
      }
      const cells = line
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0);
      const isHeader =
        i > 0 && lines[i - 1] && /^\|[\s\-:]+\|/.test(lines[i - 1].trim());

      if (isHeader && tableRows.length === 0) {
        tableRows.push('<thead><tr>');
        cells.forEach((cell) => {
          tableRows.push(
            `<th class="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-700 font-semibold text-gray-900 dark:text-gray-100">${cell}</th>`,
          );
        });
        tableRows.push('</tr></thead><tbody>');
      } else {
        tableRows.push('<tr>');
        cells.forEach((cell) => {
          tableRows.push(
            `<td class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-900 dark:text-gray-100">${cell}</td>`,
          );
        });
        tableRows.push('</tr>');
      }
    } else if (isTableSeparator) {
      // Skip separator lines
      continue;
    } else {
      if (inTable) {
        tableRows.push('</tbody></table>');
        processedLines.push(tableRows.join(''));
        tableRows = [];
        inTable = false;
      }
      processedLines.push(line);
    }
  }

  if (inTable) {
    tableRows.push('</tbody></table>');
    processedLines.push(tableRows.join(''));
  }

  html = processedLines.join('\n');

  // Headers
  html = html.replace(
    /^### (.*$)/gim,
    '<h3 class="text-xl font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100">$1</h3>',
  );
  html = html.replace(
    /^## (.*$)/gim,
    '<h2 class="text-2xl font-semibold mt-6 mb-3 text-gray-900 dark:text-gray-100">$1</h2>',
  );
  html = html.replace(
    /^# (.*$)/gim,
    '<h1 class="text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-100">$1</h1>',
  );

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Paragraphs (double line breaks)
  const paragraphs = html.split('\n\n');
  html = paragraphs
    .map((para) => {
      const trimmed = para.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<')) return trimmed; // Already HTML (tables, headers, etc.)
      // Replace single line breaks with <br> within paragraphs
      const withBreaks = trimmed.replace(/\n/g, '<br>');
      return `<p class="mb-4 text-gray-900 dark:text-gray-100">${withBreaks}</p>`;
    })
    .join('\n');

  return html;
};

