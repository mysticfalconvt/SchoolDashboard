import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import React from 'react';
import useForm from '../../lib/useForm';
import Error from '../ErrorMessage';

const SEND_MAGIC_LINK_MUTATION = gql`
  mutation SEND_MAGIC_LINK_MUTATION($email: String!) {
    sendUserMagicAuthLink(email: $email)
  }
`;

interface SignInInputs {
  email: string;
  password: string;
}

const MagicLinkSignIn: React.FC = () => {
  const { inputs, handleChange, resetForm } = useForm({
    email: '',
    password: '',
  });
  const [magicLinkSent, setMagicLinkSent] = React.useState(false);
  const [
    sendMagicLink,
    { data: sendData, loading: sendMagicLinkLoading, error: sendError },
  ] = useGqlMutation(SEND_MAGIC_LINK_MUTATION);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendMagicLink({
        email: inputs?.email?.toLowerCase(),
      });
      setMagicLinkSent(true);
    } catch (error) {
      console.error('Error sending magic link:', error);
    }
  };

  return (
    <form method="POST" onSubmit={handleSendMagicLink} className="space-y-6">
      {!magicLinkSent && (
        <div className="space-y-4">
          <Error error={sendError} />
          <div>
            <label
              htmlFor="email"
              className="block text-white font-medium mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="Enter your email address"
              autoComplete="email"
              value={inputs.email}
              onChange={handleChange}
              disabled={sendMagicLinkLoading || magicLinkSent}
              className="w-full px-4 py-3 rounded-lg border-2 border-white/20 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all duration-200"
              required
            />
          </div>
          <button
            type="submit"
            disabled={sendMagicLinkLoading || magicLinkSent}
            className="w-full py-3 px-6 rounded-lg font-bold text-white transition-all duration-200 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(to top left, #38B6FF, #760D08)',
            }}
          >
            {sendMagicLinkLoading ? 'Sending...' : 'Send Sign In Link'}
          </button>
        </div>
      )}
      {magicLinkSent && (
        <div className="text-center space-y-4">
          <div className="text-4xl mb-4">📧</div>
          <h3 className="text-xl font-bold text-white mb-2">
            Check Your Email
          </h3>
          <p className="text-white/80 text-lg leading-relaxed">
            We've sent a sign-in link to your email address. Please check your
            inbox and click the link to sign in.
          </p>
          <p className="text-white/60 text-sm">
            If you don't see the email, check your spam folder.
          </p>
        </div>
      )}
    </form>
  );
};

export default MagicLinkSignIn;
