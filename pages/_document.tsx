import Document, { Head, Html, Main, NextScript } from 'next/document';
import { umamiUrl, umamiWebsiteId } from '../config';

export default class MyDocument extends Document {
  // static getInitialProps({ renderPage }: DocumentContext): Promise<DocumentInitialProps> {
  //   const sheet = new ServerStyleSheet();
  //   const page = renderPage((App) => (props) =>
  //     sheet.collectStyles(<App {...props} />),
  //   );
  //   const styleTags = sheet.getStyleElement();
  //   console.log(page);
  //   return { ...page, styleTags };
  // }

  render() {
    return (
      <Html lang="en-CA">
        <Head>
          {process.env.NODE_ENV === 'production' && (
            <script
              async
              src={`${umamiUrl}/script.js`}
              data-website-id={umamiWebsiteId || ''}
            ></script>
          )}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
