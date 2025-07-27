import type { AppProps } from 'next/app';
import '../styles/globals.css';

import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { ApolloProvider } from '@apollo/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';

import Page from '../components/Page';
import withData from '../lib/withData';

const queryClient = new QueryClient();
queryClient.setDefaultOptions({ queries: { staleTime: 10000 } });

interface MyAppProps extends AppProps {
  apollo: ApolloClient<NormalizedCacheObject>;
}

function MyApp({ Component, pageProps, apollo }: MyAppProps) {
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

MyApp.getInitialProps = async function ({ Component, ctx }: any) {
  let pageProps: any = {};
  if (Component.getInitialProps) {
    pageProps = await Component.getInitialProps(ctx);
  }
  pageProps.query = ctx.query;
  return { pageProps };
};

export default withData(MyApp);
