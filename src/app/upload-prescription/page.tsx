"use client";

import { useRef, useState } from "react";
import { UploadCloud, CheckCircle2, ShieldAlert, FileText, X } from "lucide-react";
import Link from "next/link";

export default function UploadPrescription() {
  const [dragActive, setDragActive] = useState(false);
  const [justDropped, setJustDropped] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  // Guard against dragleave firing when moving over child elements
  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Some browsers need this to keep the drop enabled
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      // Play the "drop success" bounce animation once
      setJustDropped(true);
      setTimeout(() => setJustDropped(false), 500);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!file) return;
    setIsUploading(true);
    // Simulate upload
    setTimeout(() => {
      setIsUploading(false);
      setIsSuccess(true);
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Prescription Received!</h1>
        <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
          Our licensed pharmacist will review your prescription shortly. You will receive an SMS when your order is ready to be processed.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/shop" className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors">
            Continue Shopping
          </Link>
          <Link href="/account" className="bg-white text-gray-900 border border-gray-200 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            View My Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload Prescription</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload a clear photo or scan of your doctor's prescription. A licensed pharmacist will verify the details before we dispense your medication.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-10 shadow-sm">
        
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 flex items-start gap-3">
          <ShieldAlert className="text-blue-600 mt-0.5" size={20} />
          <div className="text-sm">
            <strong className="text-blue-900 block mb-1">Privacy & Security</strong>
            <span className="text-blue-800">Your health information is encrypted and strictly confidential. Only licensed pharmacists have access to your uploaded prescriptions.</span>
          </div>
        </div>

        {!file ? (
          <div
            className={`dropzone relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
              ${dragActive ? "dropzone--active" : "border-gray-300 hover:border-red-400 hover:bg-gray-50"}
              ${justDropped ? "dropzone--dropped" : ""}
            `}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-upload")?.click()}
            aria-label="Drop prescription file here, or click to browse"
          >
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept="image/*,.pdf"
              onChange={handleChange}
            />
            <div className="relative w-16 h-16 mx-auto mb-4">
              {/* Pulsing ring behind the icon, visible only when dragging */}
              <span
                className="dropzone-ring absolute inset-0 rounded-full border-2 border-red-400 opacity-0 pointer-events-none"
                aria-hidden="true"
              />
              <div
                className={`relative w-16 h-16 bg-white border rounded-full flex items-center justify-center shadow-sm transition-colors
                  ${dragActive ? "border-red-300" : "border-gray-100"}
                `}
              >
                <UploadCloud
                  size={32}
                  className={`transition-colors ${dragActive ? "text-red-600" : "text-gray-400"}`}
                />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {dragActive ? "Release to upload" : "Click to upload or drag and drop"}
            </h3>
            <p className={`text-sm transition-colors ${dragActive ? "text-red-600" : "text-gray-500"}`}>
              JPG, PNG, or PDF (Max. 10MB)
            </p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="text-red-600" size={24} />
                <div>
                  <div className="font-medium text-gray-900">{file.name}</div>
                  <div className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
              </div>
              <button 
                onClick={() => setFile(null)}
                className="text-gray-400 hover:text-red-600 transition-colors p-2"
                aria-label="Remove file"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (Optional)</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-red-500 focus:border-red-500"
                  rows={3}
                  placeholder="Any specific instructions for the pharmacist?"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number for Verification</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    +233
                  </span>
                  <input 
                    type="tel" 
                    className="flex-1 block w-full min-w-0 rounded-none rounded-r-lg border border-gray-300 px-3 py-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    placeholder="e.g. 20 123 4567"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={isUploading}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                "Submit Prescription"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}