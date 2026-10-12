// The backend drops an email body straight into an HTML template, so a body
// written as plain text loses its line breaks and its URLs stay unclickable.
// This converts plain text into the HTML that template expects: blank lines
// become paragraphs, single newlines become <br>, and URLs become links.

const URL_REGEX = /https?:\/\/[^\s<]+[^\s<.,;:!?)'"”’]/g;

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const linkify = (escaped: string) =>
  escaped.replace(URL_REGEX, (url) => `<a href="${url}">${url}</a>`);

export default function plainTextEmailToHtml(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p>${linkify(escapeHtml(paragraph)).replace(/\n/g, '<br>')}</p>`,
    )
    .join('\n');
}
