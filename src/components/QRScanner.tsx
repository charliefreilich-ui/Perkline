import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  expectedSecret?: string;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose, expectedSecret }) => {
  const qrCodeRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader", {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false
    });
    qrCodeRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        setIsInitializing(true);
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            onScan(decodedText);
          },
          undefined // Ignore errors for quiet scanning
        );
        setIsInitializing(false);
      } catch (err) {
        console.error("Failed to start QR scanner:", err);
        setError("Camera access denied or device not found. Please ensure you've granted camera permissions.");
        setIsInitializing(false);
      }
    };

    startScanner();

    return () => {
      const stopScanner = async () => {
        if (qrCodeRef.current && qrCodeRef.current.isScanning) {
          try {
            await qrCodeRef.current.stop();
          } catch (err) {
            console.error("Failed to stop QR scanner during cleanup:", err);
          }
        }
      };
      stopScanner();
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#1a0a2e] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
        <div className="p-6 flex justify-between items-center bg-white/5">
          <div>
            <h3 className="text-xl font-bold text-white">Scan QR Code</h3>
            <p className="text-xs text-purple-400 font-medium uppercase tracking-widest mt-1 text-glow">Verify at Merchant</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 relative">
          <div 
            id="qr-reader" 
            className="overflow-hidden rounded-2xl border-2 border-dashed border-white/20 bg-black/40 min-h-[300px] flex items-center justify-center"
          >
            {isInitializing && !error && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-slate-400 text-sm">Initializing camera...</p>
              </div>
            )}
            
            {error && (
              <div className="p-8 text-center">
                <AlertCircle size={48} className="text-red-500 mx-auto mb-4 opacity-50" />
                <p className="text-red-400 text-sm font-medium">{error}</p>
                <button 
                  onClick={onClose}
                  className="mt-6 px-6 py-2 bg-white/10 rounded-xl text-white text-sm font-bold uppercase tracking-widest hover:bg-white/20 transition-colors"
                >
                  Go Back
                </button>
              </div>
            )}
          </div>

          {/* Scanner Overlay */}
          {!isInitializing && !error && (
            <div className="absolute inset-4 pointer-events-none flex items-center justify-center">
              <div className="w-[250px] h-[250px] border-2 border-purple-500 rounded-2xl relative shadow-[0_0_0_1000px_rgba(0,0,0,0.3)]">
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                
                {/* Scanning Line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_15px_rgba(192,132,252,0.8)] animate-scanner-line"></div>
              </div>
            </div>
          )}

          {expectedSecret && !error && (
            <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-start gap-3">
              <Camera size={18} className="text-purple-400 shrink-0 mt-0.5" />
              <p className="text-xs text-purple-200 leading-relaxed">
                Scan the unique QR code located at the merchant's register to verify and claim your perk.
              </p>
            </div>
          )}
        </div>
        
        <div className="p-6 bg-white/5 text-center">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest opacity-80">
            Scanning Active
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
