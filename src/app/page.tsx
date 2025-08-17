"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import Image from "next/image";

export default function HomePage() {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const router = useRouter();
  const { setUserName, setUserPhone } = useCartStore();

  const validateName = (value: string) => {
    if (!value.startsWith("@")) {
      setNameError("Username must start with @ (e.g., @TwitterHandle)");
      return false;
    }
    setNameError("");
    return true;
  };

  const validatePhone = (value: string) => {
    const phoneRegex = /^\d{10}$/;
    if (!value) {
      setPhoneError("Phone number is required");
      return false;
    }
    if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ""))) {
      setPhoneError("Please enter a valid phone number");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const handleStart = () => {
    const isNameValid = validateName(name);
    const isPhoneValid = validatePhone(phoneNumber);

    if (!isNameValid || !isPhoneValid) return;

    setUserName(name.trim());
    setUserPhone(phoneNumber.trim());
    router.push("/pos");
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4 sm:gap-6 p-4 sm:p-6 bg-gray-50">
      <div className="w-full max-w-sm sm:max-w-md">
        <Image
          src="/images/logo.png"
          alt="MyShop Logo"
          width={300}
          height={75}
          className="h-12 sm:h-16 w-auto mx-auto mb-4 sm:mb-6"
          unoptimized={false}
        />

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-center text-gray-900">
          Please enter your name
        </h1>

        <div className="flex flex-col gap-2 mb-4">
          <input
            type="text"
            placeholder="@YourTwitterAccount"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) validateName(e.target.value);
            }}
            className={`px-4 sm:px-5 py-3 sm:py-4 border rounded-lg text-center text-base sm:text-lg transition w-full touch-manipulation
              ${
                nameError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }
              focus:outline-none focus:ring-2`}
          />
          {nameError && (
            <p className="text-red-500 text-sm text-center px-2">{nameError}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 mb-6">
          <input
            type="tel"
            placeholder="Phone Number (e.g., 080XXXXXXX)"
            value={phoneNumber}
            onChange={(e) => {
              setPhoneNumber(e.target.value);
              if (phoneError) validatePhone(e.target.value);
            }}
            className={`px-4 sm:px-5 py-3 sm:py-4 border rounded-lg text-center text-base sm:text-lg transition w-full touch-manipulation
              ${
                phoneError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }
              focus:outline-none focus:ring-2`}
          />
          {phoneError && (
            <p className="text-red-500 text-sm text-center px-2">
              {phoneError}
            </p>
          )}
        </div>

        <button
          onClick={handleStart}
          disabled={!name || !phoneNumber || !!nameError || !!phoneError}
          className={`w-full py-3 sm:py-4 rounded-xl text-white font-medium text-base sm:text-lg transition touch-manipulation min-h-[44px]
            ${
              !name || !phoneNumber || !!nameError || !!phoneError
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
            }
          `}
        >
          Start
        </button>
      </div>
    </main>
  );
}
