import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '../styles/Dialog';
import { useUser } from '../User';
import MagicLinkSignIn from './MagicLinkSignIn';

interface SignInDialogProps {
  isOpen: boolean;
  onClose?: () => void;
}

const SignInDialog: React.FC<SignInDialogProps> = ({ isOpen, onClose }) => {
  const me = useUser();
  const [showDialog, setShowDialog] = useState(false);

  // Show dialog when user is not authenticated
  useEffect(() => {
    if (!me && isOpen) {
      setShowDialog(true);
    } else {
      setShowDialog(false);
    }
  }, [me, isOpen]);

  const handleClose = () => {
    setShowDialog(false);
    onClose?.();
  };

  // Don't render anything if user is authenticated
  if (me) {
    return null;
  }

  return (
    <Dialog
      isOpen={showDialog}
      onClose={handleClose}
      title="Welcome to NCUJHS Dashboard"
      size="lg"
      showCloseButton={false}
      closeOnBackdropClick={false}
      className="max-w-2xl"
    >
      <DialogContent className="text-center">
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <img src="/falcon.svg" alt="NCUJHS Falcon" className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            NCUJHS Dashboard
          </h1>
          <p className="text-white/80 text-lg">
            Sign in to access your dashboard
          </p>
        </div>

        <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
          <MagicLinkSignIn />
        </div>

        <div className="mt-6 text-white/60 text-sm">
          <p>Check your email for the sign-in link after submitting</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignInDialog;
