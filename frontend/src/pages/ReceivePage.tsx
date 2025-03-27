import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useUser } from '@/context/UserContext';

const ReceivePage = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const { user } = useUser();

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(user.wallet_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full max-w-none p-0">
      <header className="fixed top-0 w-full bg-background/80 backdrop-blur-lg border-b border-border/40 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold ml-4">Receive Crypto</h1>
        </div>
      </header>

      <main className="pt-32 pb-16  absolute inset-0 flex justify-center items-center w-full min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md px-18"
        >
          <Card className="p-6 backdrop-blur-sm bg-card/50">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-6">Your Wallet Address</h2>
              <div className="bg-muted p-4 rounded-lg mb-6">
                <p className="font-mono break-all">{user.wallet_address}</p>
              </div>
              <Button
                onClick={handleCopy}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" /> Copy Address
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default ReceivePage;