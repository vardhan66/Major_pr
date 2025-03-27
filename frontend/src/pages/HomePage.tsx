import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap, Lock } from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (

    <div className="min-h-screen">
      <Navbar />


      <main className="container mx-auto px-4 pt-32 pb-16">
        <ParticleBackground></ParticleBackground>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >

          <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-purple-600">
            Revolutionizing digital transactions with cutting-edge, meme-inspired crypto
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Secure, decentralized, and powered by advanced face recognition technology.
            Take control of your digital assets with confidence.
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
              Get Started <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-8 mt-24"
        >
          <div className="bg-card p-6 rounded-lg border border-border/50 backdrop-blur-sm">
            <Shield className="h-12 w-12 text-purple-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Secure by Design</h3>
            <p className="text-muted-foreground">
              Advanced facial recognition and liveness detection for unparalleled security.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg border border-border/50 backdrop-blur-sm">
            <Zap className="h-12 w-12 text-purple-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-muted-foreground">
              Instant transactions with minimal fees and maximum efficiency.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg border border-border/50 backdrop-blur-sm">
            <Lock className="h-12 w-12 text-purple-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Fully Decentralized</h3>
            <p className="text-muted-foreground">
              Your keys, your crypto. Complete control over your digital assets.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default HomePage;