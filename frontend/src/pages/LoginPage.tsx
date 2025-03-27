import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { useUser } from '@/context/UserContext'; // Import useUser

const LoginPage = () => {
  const [passphrase, setPassphrase] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { setUser } = useUser(); // Get setUser from context

  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please allow camera permissions.");
    }
  };

  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        try {
          const rgbCanvas = document.createElement('canvas');
          rgbCanvas.width = 128;
          rgbCanvas.height = 128;
          const rgbContext = rgbCanvas.getContext('2d', { alpha: false });
          rgbContext.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, 128, 128);

          const blob = await new Promise((resolve, reject) => {
            rgbCanvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Failed to create blob"));
            }, "image/jpeg", 0.95);
          });

          const previewUrl = URL.createObjectURL(blob);
          setCapturedImage(previewUrl);

          const file = new File([blob], "captured-image.jpg", {
            type: "image/jpeg",
            lastModified: new Date().getTime()
          });

          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);

          if (fileInputRef.current) {
            fileInputRef.current.files = dataTransfer.files;
          }

          return true;
        } catch (err) {
          console.error("Error creating file:", err);
          return false;
        }
      }
    }
    return false;
  };

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    if (!passphrase.trim()) {
      setError('Passphrase is required');
      setLoading(false);
      return;
    }

    if (!cameraActive) {
      setError('Please start the camera first');
      setLoading(false);
      return;
    }

    try {
      const captured = await captureImage();
      if (!captured || !fileInputRef.current || !fileInputRef.current.files || fileInputRef.current.files.length === 0) {
        throw new Error("Failed to capture image. Try again.");
      }

      const form = document.createElement('form');
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.name = 'image';
      fileInput.files = fileInputRef.current.files;
      form.appendChild(fileInput);

      const passphraseInput = document.createElement('input');
      passphraseInput.type = 'text';
      passphraseInput.name = 'passphrase';
      passphraseInput.value = passphrase;
      form.appendChild(passphraseInput);

      const formData = new FormData(form);

      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // Store user data in context
        setUser({
          name: data.user.name,
          wallet_address: data.user.wallet_address,
          passphrase: data.user.passphrase,
          balance: data.user.balance,
        });
        navigate('/dashboard');
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className=" absolute inset-0 flex justify-center container mx-auto px-4 pt-32 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto"
        >
          <Card className="p-6 backdrop-blur-sm bg-card/50">
            <h2 className="text-2xl font-bold mb-6 text-center">Welcome Back</h2>
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Enter your passphrase"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="bg-background/50"
              />
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                name="image"
                accept="image/*"
              />
              {!cameraActive ? (
                <Button
                  onClick={startCamera}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Start Camera
                </Button>
              ) : (
                <div className="relative w-full">
                  <video
                    ref={videoRef}
                    autoPlay
                    className="w-full rounded shadow-lg mb-4"
                  ></video>
                  <canvas ref={canvasRef} className="hidden"></canvas>
                </div>
              )}
              {error && <p className="text-red-500 text-center">{error}</p>}
              <Button
                onClick={handleLogin}
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={loading || !cameraActive}
              >
                {loading ? 'Verifying...' : 'Login'}
              </Button>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default LoginPage;