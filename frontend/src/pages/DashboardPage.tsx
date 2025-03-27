import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu, Send, Download, History, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { useState, useEffect } from 'react';
import axios from 'axios';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, setUser, loading } = useUser();
  const [cryptoData, setCryptoData] = useState([
    { name: 'Bitcoin', symbol: 'BTC', price: '45,232.67', change: '+2.5%' },
    { name: 'Ethereum', symbol: 'ETH', price: '3,115.89', change: '-1.2%' },
    { name: 'Solana', symbol: 'SOL', price: '112.45', change: '+5.7%' },
    { name: 'Binance Coin', symbol: 'BNB', price: '0.00', change: '0.0%' },
    { name: 'Cardano', symbol: 'ADA', price: '0.00', change: '0.0%' },
  ]);

  const fetchCryptoPrices = async () => {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,cardano&vs_currencies=usd&include_24hr_change=true'
      );
      const data = response.data;

      const updatedCryptoData = [
        {
          name: 'Bitcoin',
          symbol: 'BTC',
          price: data.bitcoin.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          change: data.bitcoin.usd_24h_change.toFixed(1) + '%',
        },
        {
          name: 'Ethereum',
          symbol: 'ETH',
          price: data.ethereum.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          change: data.ethereum.usd_24h_change.toFixed(1) + '%',
        },
        {
          name: 'Solana',
          symbol: 'SOL',
          price: data.solana.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          change: data.solana.usd_24h_change.toFixed(1) + '%',
        },
        {
          name: 'Binance Coin',
          symbol: 'BNB',
          price: data.binancecoin.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          change: data.binancecoin.usd_24h_change.toFixed(1) + '%',
        },
        {
          name: 'Cardano',
          symbol: 'ADA',
          price: data.cardano.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          change: data.cardano.usd_24h_change.toFixed(1) + '%',
        },
      ];

      setCryptoData(updatedCryptoData);
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
    }
  };

  useEffect(() => {
    fetchCryptoPrices(); // Fetch prices on component mount
    const interval = setInterval(fetchCryptoPrices, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background w-full max-w-none p-0">
      <header className="fixed top-0 w-full bg-background/80 backdrop-blur-lg border-b border-border/40 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => { }}>
                    <History className="mr-2 h-5 w-5" />
                    Transaction History
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                    <LogOut className="mr-2 h-5 w-5" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-xl font-bold ml-4">Dashboard</h1>
          </div>
          <p className="text-base font-medium text-foreground">Welcome, {user.name}</p>
        </div>
      </header>

      <main className="pt-36 pb-16  absolute inset-0 flex justify-center items-center w-full">
        <div className="w-full max-w-lg px-6 ">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h2 className="text-5xl font-bold mb-6">
              ${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <div className="flex justify-center gap-4">
              <Link to="/send">
                <Button className="bg-purple-600 hover:bg-purple-700 px-6 py-2 text-base">
                  <Send className="mr-2 h-5 w-5" /> Send
                </Button>
              </Link>
              <Link to="/receive">
                <Button variant="outline" className="px-6 py-2 text-base">
                  <Download className="mr-2 h-5 w-5" /> Receive
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            {cryptoData.map((crypto) => (
              <Card key={crypto.symbol} className="p-3 backdrop-blur-sm bg-card/50">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-base">{crypto.name}</h3>
                    <p className="text-xs text-muted-foreground">{crypto.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-base">${crypto.price}</p>
                    <p className={crypto.change.startsWith('+') ? 'text-green-500' : 'text-red-500'} style={{ fontSize: '12px' }}>
                      {crypto.change}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;