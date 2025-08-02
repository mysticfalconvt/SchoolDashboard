import type { NextPage } from 'next';
import RequestReset from '../components/RequestReset';
import Reset from '../components/Reset';

interface ResetPageProps {
  query: {
    token?: string;
  };
}

const ResetPage: NextPage<ResetPageProps> = ({ query }) => {
  if (!query?.token) {
    return (
      <div>
        <p>Sorry you must supply a token</p>
        <RequestReset />
      </div>
    );
  }
  return (
    <div>
      <p>RESET YOUR PASSWORD</p>
      <Reset token={query.token} />
    </div>
  );
};

export default ResetPage;
