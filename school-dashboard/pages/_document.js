import Document, { Html, Head, NextScript, Main } from "next/document";
// import { ServerStyleSheet } from 'styled-components';

export default class MyDocument extends Document {
  // static getInitialProps({ renderPage }) {
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
          {process.env.NODE_ENV === "production" && (
            <script
              async
              src="https://umami.rboskind.com/script.js"
              data-website-id={process.env.UMAMI_ID || ""}
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
