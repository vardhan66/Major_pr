import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { useUser } from '@/context/UserContext';

const SendPage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'failed' | null>(null);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for the video to load metadata
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please allow camera permissions.");
      setCameraActive(false);
    }
  };

  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context && videoRef.current.videoWidth && videoRef.current.videoHeight) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        try {
          const rgbCanvas = document.createElement('canvas');
          rgbCanvas.width = 128;
          rgbCanvas.height = 128;
          const rgbContext = rgbCanvas.getContext('2d', { alpha: false });
          rgbContext?.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, 128, 128);

          const blob = await new Promise<Blob>((resolve, reject) => {
            rgbCanvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Failed to create blob"));
            }, "image/jpeg", 0.95);
          });

          const previewUrl = URL.createObjectURL(blob);
          setCapturedImage(previewUrl);

          const file = new File([blob], "captured-image.jpg", {
            type: "image/jpeg",
            lastModified: new Date().getTime(),
          });

          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);

          if (fileInputRef.current) {
            fileInputRef.current.files = dataTransfer.files;
            return true;
          } else {
            setError("File input not found.");
            return false;
          }
        } catch (err) {
          console.error("Error creating file:", err);
          setError("Failed to capture image.");
          return false;
        }
      } else {
        setError("Camera not ready or no video stream available.");
        return false;
      }
    }
    setError("Video or canvas element not found.");
    return false;
  };

  const handleSend = async () => {
    setError('');
    setVerifying(true);
    setVerificationStatus(null);

    if (!user) {
      setError('You must be logged in to send a transaction.');
      setVerifying(false);
      return;
    }

    if (!address.trim() || !amount.trim()) {
      setError('Recipient address and amount are required.');
      setVerifying(false);
      return;
    }

    if (!cameraActive) {
      setError('Please start the camera first.');
      setVerifying(false);
      return;
    }

    if (!capturedImage) {
      setError('Please capture an image before sending.');
      setVerifying(false);
      return;
    }

    try {
      if (!fileInputRef.current || !fileInputRef.current.files || fileInputRef.current.files.length === 0) {
        throw new Error("No captured image available.");
      }

      const formData = new FormData();
      formData.append('image', fileInputRef.current.files[0]);
      formData.append('sender_address', user.wallet_address);
      formData.append('recipient_address', address);
      formData.append('amount', amount);

      const response = await fetch("http://localhost:8000/send", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const amountFloat = parseFloat(amount);
        setUser({
          ...user,
          balance: user.balance - amountFloat,
        });
        setVerificationStatus('success');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setVerificationStatus('failed');
        setError(data.message || 'Transaction failed.');
        setTimeout(() => {
          setVerifying(false);
        }, 2000);
      }
    } catch (err) {
      console.error("Send error:", err);
      setVerificationStatus('failed');
      setError(err.message || 'Something went wrong. Please try again.');
      setTimeout(() => {
        setVerifying(false);
      }, 2000);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
      setCapturedImage(null);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 w-full bg-background/80 backdrop-blur-lg border-b border-border/40 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold ml-4">Send Crypto</h1>
        </div>
      </header>

      <main className=" flex justify-center absolute inset-0 container mx-auto px-4 pt-32 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto"
        >
          <Card className="p-12 backdrop-blur-sm bg-card/50">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Wallet Address</label>
                <Input
                  placeholder="Enter recipient's wallet address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Amount</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              {!cameraActive ? (
                <Button
                  onClick={startCamera}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Start Camera
                </Button>
              ) : (
                <>
                  <div className="relative w-full">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full rounded shadow-lg mb-4"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  <Button
                    onClick={captureImage}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={verifying}
                  >
                    Capture Image
                  </Button>
                  <Button
                    onClick={handleSend}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={verifying || !capturedImage}
                  >
                    {verifying ? 'Verifying...' : 'Send'}
                  </Button>
                  <Button
                    onClick={stopCamera}
                    className="w-full bg-red-600 hover:bg-red-700"
                    disabled={verifying}
                  >
                    Stop Camera
                  </Button>
                </>
              )}
              {error && <p className="text-red-500 text-center">{error}</p>}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                name="image"
                accept="image/*"
              />
            </div>
          </Card>
        </motion.div>

        <Dialog open={verifying} onOpenChange={() => { }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verifying Identity</DialogTitle>
            </DialogHeader>
            <div className="py-6">
              {verificationStatus === null && (
                <Card className="aspect-video relative overflow-hidden">
                  {capturedImage && (
                    <img
                      src={capturedImage}
                      alt="Captured frame"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                </Card>
              )}
              {verificationStatus === 'success' && (
                <div className="text-center text-green-500">
                  <Check className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-lg font-semibold">Transaction Successful!</p>
                </div>
              )}
              {verificationStatus === 'failed' && (
                <div className="text-center text-red-500">
                  <AlertCircle className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-lg font-semibold">Verification Failed</p>
                  <p className="text-sm text-muted-foreground mt-2">{error}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default SendPage;