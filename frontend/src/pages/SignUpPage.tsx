import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";

const SignUpPage = () => {
  const [name, setName] = useState("");
  const [wallet, setWallet] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

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
          // Create a second canvas to convert RGBA to RGB
          const rgbCanvas = document.createElement('canvas');
          rgbCanvas.width = 128;  // Set to your required dimensions
          rgbCanvas.height = 128;
          const rgbContext = rgbCanvas.getContext('2d', { alpha: false });  // Important: alpha: false creates RGB context

          // Draw the original image onto the RGB canvas, resizing to 128x128
          rgbContext.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, 128, 128);

          // Convert canvas to blob with JPEG format (which doesn't have alpha channel)
          const blob = await new Promise((resolve, reject) => {
            rgbCanvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Failed to create blob"));
            }, "image/jpeg", 0.95);  // Using JPEG instead of PNG
          });

          // Create a preview URL
          const previewUrl = URL.createObjectURL(blob);
          setCapturedImage(previewUrl);

          // Create a file from the blob
          const file = new File([blob], "captured-image.jpg", {
            type: "image/jpeg",
            lastModified: new Date().getTime()
          });

          // Create a DataTransfer object to create a FileList
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);

          // Assign the FileList to the file input
          if (fileInputRef.current) {
            fileInputRef.current.files = dataTransfer.files;
          }

          return file;
        } catch (err) {
          console.error("Error creating file:", err);
          return null;
        }
      }
    }
    return null;
  };

  const handleRegister = async () => {
    setError("");
    if (!name.trim()) {
      setError("Username is required.");
      return;
    }

    if (!cameraActive) {
      setError("Please start the camera first.");
      return;
    }

    setLoading(true);

    try {
      // Capture the image as a file
      const imageFile = await captureImage();

      if (!imageFile) {
        throw new Error("Failed to capture image. Try again.");
      }

      // Create a FormData object to send both name and image
      const formData = new FormData();
      formData.append('name', name);
      formData.append('image', imageFile, 'captured-image.jpg');

      // Send the FormData to the server
      const response = await fetch(`http://localhost:8000/register`, {
        method: "POST",
        body: formData,
        // Note: Do NOT set Content-Type header when using FormData
        // The browser will automatically set the correct multipart/form-data boundary
      });

      if (!response.ok) {
        throw new Error(`Registration failed. Server returned ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setWallet(data.wallet_address);
        setPassphrase(data.passphrase);
      } else {
        setError(data.message || "Registration failed with unknown error.");
      }
    } catch (err) {
      console.error("Error during registration:", err);
      setError(err.message || "Something went wrong. Please try again.");
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

      <main className="container absolute inset-0 flex justify-center mx-auto px-4 pt-32 pb-16">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-6 backdrop-blur-sm bg-card/50">
              <h2 className="text-2xl font-bold mb-4">Register Account</h2>
              <div className="space-y-4">
                <Input
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {error && <p className="text-red-500">{error}</p>}
                <Button
                  onClick={handleRegister}
                  disabled={loading || !cameraActive}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? "Registering..." : "Register"}
                </Button>

                {wallet && (
                  <div className="mt-4 p-3 bg-gray-100 rounded">
                    <p>
                      <strong>Wallet Address:</strong> {wallet}
                    </p>
                    <p>
                      <strong>Passphrase:</strong> {passphrase}
                    </p>
                    <Button
                      onClick={() => navigator.clipboard.writeText(passphrase)}
                      className="mt-2"
                    >
                      Copy Passphrase
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            {!cameraActive ? (
              <Button onClick={startCamera} className="bg-blue-600 hover:bg-blue-700">
                Start Camera
              </Button>
            ) : (
              <div className="relative w-full max-w-md">
                <video ref={videoRef} autoPlay className="w-full rounded shadow-lg"></video>
                <canvas ref={canvasRef} className="hidden"></canvas>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default SignUpPage;