import "../pages/global.css";
import * as Sentry from "@sentry/react";

import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import { ApolloProvider } from "@apollo/client";
import Router from "next/router";

import Page from "../components/Page";
import withData from "../lib/withData";

const queryClient = new QueryClient();
queryClient.setDefaultOptions({ queries: { staleTime: 10000 } });
// console.log('MyApp.js');
// console.log(queryClient.getDefaultOptions());
function MyApp({ Component, pageProps, apollo }) {
  Sentry.init({
    dsn: "https://fd136ab708a7f9d31644905e226b92e5@o4506610880741376.ingest.sentry.io/4506614637002752",
    integrations: [
      new Sentry.BrowserTracing({
        // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
        tracePropagationTargets: [
          "localhost",
          /^https:\/\/yourserver\.io\/api/,
        ],
      }),
    ],
    enabled: process.env === "production",
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
  });
  return (
    <>
      <ApolloProvider client={apollo}>
        <QueryClientProvider client={queryClient}>
          <Page>
            <Component {...pageProps} />
          </Page>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ApolloProvider>
    </>
  );
}

MyApp.getInitialProps = async function ({ Component, ctx }) {
  let pageProps = {};
  if (Component.getInitialProps) {
    pageProps = await Component.getInitialProps(ctx);
  }
  pageProps.query = ctx.query;
  return { pageProps };
};

export default withData(MyApp);
