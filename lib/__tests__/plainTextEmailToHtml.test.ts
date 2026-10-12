import plainTextEmailToHtml from '../plainTextEmailToHtml';

describe('plainTextEmailToHtml', () => {
  it('turns blank-line separated text into paragraphs and single newlines into <br>', () => {
    expect(
      plainTextEmailToHtml('Dear Sam,\n\nLine one\nLine two\n\n\nBye'),
    ).toBe('<p>Dear Sam,</p>\n<p>Line one<br>Line two</p>\n<p>Bye</p>');
  });

  it('makes URLs clickable without swallowing trailing punctuation', () => {
    const url = 'https://drive.google.com/file/d/abc_123-XYZ/view';
    expect(plainTextEmailToHtml(`See the poster here: ${url}. Thanks!`)).toBe(
      `<p>See the poster here: <a href="${url}">${url}</a>. Thanks!</p>`,
    );
  });

  it('escapes HTML characters in names and text', () => {
    expect(plainTextEmailToHtml('Tom & Jerry <3')).toBe(
      '<p>Tom &amp; Jerry &lt;3</p>',
    );
  });

  it('keeps curly quotes and apostrophes as they are', () => {
    expect(
      plainTextEmailToHtml('The PBIS Team\n“Have a tree-menous day!”'),
    ).toBe('<p>The PBIS Team<br>“Have a tree-menous day!”</p>');
  });
});
