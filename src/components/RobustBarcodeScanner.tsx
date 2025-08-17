"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { XMarkIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { Html5Qrcode } from "html5-qrcode";
// Removed unused import

interface RobustBarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (barcode: string) => void;
}

export default function RobustBarcodeScanner({
  isOpen,
  onClose,
  onScanResult,
}: RobustBarcodeScannerProps) {
  const [error, setError] = useState<string>("");
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string>("");
  const [scannerState, setScannerState] = useState<string>("idle");
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitializingRef = useRef(false);
  const isCleaningUpRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      loadCamerasAndStart();
    } else {
      cleanupScanner();
    }

    return () => {
      cleanupScanner();
    };
  }, [isOpen, cleanupScanner]);

  const loadCamerasAndStart = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();

      // Select back camera if available, otherwise first camera
      const backCamera = devices.find(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("rear") ||
          device.label.toLowerCase().includes("environment")
      );

      const selectedCamera = backCamera || devices[0];
      if (selectedCamera) {
        setSelectedCameraId(selectedCamera.id);
        // Auto-start the scanner
        await initializeScannerWithCamera(selectedCamera.id);
      }
    } catch (err) {
      console.error("Error loading cameras:", err);
      setError("Unable to access cameras. Please check permissions.");
    }
  };

  const initializeScannerWithCamera = useCallback(
    async (cameraId: string) => {
      if (isInitializingRef.current || isCleaningUpRef.current) {
        console.log("Scanner already initializing or cleaning up");
        return;
      }

      if (!cameraId) {
        setError("No camera available. Please check camera permissions.");
        return;
      }

      isInitializingRef.current = true;
      setError("");

      try {
        // Clean up any existing scanner first
        await cleanupScanner();

        // Create new scanner instance
        html5QrcodeRef.current = new Html5Qrcode("html5qr-code-scanner");

        // Success callback
        const onScanSuccess = (decodedText: string) => {
          console.log("Html5Qrcode scan success:", decodedText);

          if (isValidBarcodeFlexible(decodedText)) {
            setLastScannedBarcode(decodedText);
            onScanResult(decodedText);
            handleClose();
          }
        };

        // Error callback (suppress common scanning errors)
        const onScanError = (errorMessage: string) => {
          // Only log actual errors, not scanning attempts
          if (
            !errorMessage.includes("No MultiFormat Readers") &&
            !errorMessage.includes("NotFoundException")
          ) {
            console.warn("Html5Qrcode scan error:", errorMessage);
          }
        };

        // Configuration
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.777778,
        };

        // Start scanning
        await html5QrcodeRef.current.start(
          cameraId,
          config,
          onScanSuccess,
          onScanError
        );

        setScannerState("scanning");
      } catch (err) {
        console.error("Error initializing scanner:", err);
        setError(
          "Failed to start camera. Please check permissions and try again."
        );
        setScannerState("error");
      } finally {
        isInitializingRef.current = false;
      }
    },
    [onScanResult, cleanupScanner]
  );

  const cleanupScanner = useCallback(async () => {
    if (isCleaningUpRef.current) {
      console.log("Already cleaning up scanner");
      return;
    }

    isCleaningUpRef.current = true;

    try {
      if (html5QrcodeRef.current) {
        const state = html5QrcodeRef.current.getState();

        if (state === 2) {
          // SCANNING state
          await html5QrcodeRef.current.stop();
        }

        html5QrcodeRef.current = null;
      }

      setScannerState("idle");
    } catch (err) {
      console.warn("Error during cleanup:", err);
    } finally {
      isCleaningUpRef.current = false;
    }
  }, []);

  const isValidBarcodeFlexible = (barcode: string): boolean => {
    if (!barcode) return false;

    // Remove spaces and non-alphanumeric characters for basic validation
    const cleanBarcode = barcode.replace(/[^0-9A-Za-z]/g, "");

    // Accept any barcode with reasonable length (more flexible)
    if (cleanBarcode.length >= 6 && cleanBarcode.length <= 30) {
      return true;
    }

    return false;
  };

  // Removed unused validation functions - using flexible validation only

  const handleClose = () => {
    cleanupScanner();
    onClose();
  };

  const handleManualInput = () => {
    const barcode = prompt("Enter barcode manually:");
    if (barcode && barcode.trim()) {
      const cleanBarcode = barcode.trim();
      if (isValidBarcodeFlexible(cleanBarcode)) {
        setLastScannedBarcode(cleanBarcode);
        onScanResult(cleanBarcode);
        handleClose();
      } else {
        alert("Invalid barcode format. Please enter a valid barcode.");
      }
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's an image file
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    setIsProcessingImage(true);

    try {
      // Create a separate Html5Qrcode instance for file scanning
      const fileScanner = new Html5Qrcode("html5qr-code-file-scanner");

      const result = await fileScanner.scanFile(file, true);

      console.log("Html5Qrcode file scan result:", result);

      if (result && isValidBarcodeFlexible(result)) {
        setLastScannedBarcode(result);
        onScanResult(result);
        handleClose();
      } else {
        // Try with less strict validation
        if (result && result.length >= 6) {
          setLastScannedBarcode(result);
          onScanResult(result);
          handleClose();
        } else {
          alert(
            `No barcode detected in the uploaded image.\n\nDetected: "${
              result || "none"
            }"\n\nTips:\n• Make sure the barcode is clearly visible\n• Try a higher resolution image\n• Ensure good lighting and contrast\n• Use the manual input option if needed`
          );
        }
      }
    } catch (error) {
      console.error("Error processing uploaded image:", error);

      // Provide more specific error information
      let errorMessage = "Failed to process the uploaded image.";
      if (error instanceof Error) {
        if (error.message.includes("No MultiFormat Readers")) {
          errorMessage =
            "No barcode found in the image. Please try a clearer image or use manual input.";
        } else {
          errorMessage = `Processing error: ${error.message}`;
        }
      }

      alert(errorMessage);
    } finally {
      setIsProcessingImage(false);
    }

    // Clear the input value so the same file can be selected again
    event.target.value = "";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full h-full sm:rounded-lg sm:max-w-lg sm:w-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Barcode Scanner</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-2 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4">
          {error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">{error}</div>
              <button
                onClick={() => initializeScannerWithCamera(selectedCameraId)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 touch-manipulation min-h-[44px]"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Scanner Container */}
              <div className="relative bg-black rounded-lg overflow-hidden min-h-[250px] sm:min-h-[300px]">
                <div id="html5qr-code-scanner" className="w-full" />

                {/* Hidden element for file scanning */}
                <div id="html5qr-code-file-scanner" className="hidden" />

                {/* Status Overlays */}
                <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                  {/* Scanner Status */}
                  {scannerState === "scanning" && (
                    <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                      📷 SCANNING
                    </div>
                  )}
                </div>

                {/* Processing Indicator */}
                {isProcessingImage && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-purple-500 text-white px-3 py-2 rounded text-sm font-medium animate-pulse">
                      🖼️ PROCESSING IMAGE...
                    </div>
                  </div>
                )}

                {/* Last Scanned Barcode */}
                {lastScannedBarcode && (
                  <div className="absolute bottom-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium max-w-[calc(100%-16px)] truncate">
                    Last: {lastScannedBarcode}
                  </div>
                )}
              </div>

              <div className="text-center text-sm text-gray-600">
                {scannerState === "scanning"
                  ? "📷 Hold barcode steady in the camera view"
                  : "Camera starting..."}
              </div>

              {/* Control buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                <button
                  onClick={handleImageUpload}
                  disabled={isProcessingImage}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation min-h-[44px] text-sm sm:text-base"
                >
                  <PhotoIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  {isProcessingImage ? "Processing..." : "Upload Image"}
                </button>

                <button
                  onClick={handleManualInput}
                  className="px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 active:bg-gray-800 touch-manipulation min-h-[44px] text-sm sm:text-base"
                >
                  Manual Input
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
