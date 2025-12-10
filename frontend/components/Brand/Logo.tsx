"use client";

import React from "react";
import Image from "next/image";

interface LogoProps {
  variant?: "full" | "icon" | "text";
  size?: "sm" | "md" | "lg";
  className?: string;
  showTagline?: boolean;
}

export default function Logo({
  variant = "full",
  size = "md",
  showTagline = false,
}: LogoProps) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16",
  };

  if (variant === "icon") {
    return (
      <div className={`${sizeClasses[size]} flex items-center`}>
        <Image
          src="/logo-icon.svg"
          alt="CodLabStudio"
          width={40}
          height={40}
          className="h-full w-auto"
          priority
        />
      </div>
    );
  }

  if (variant === "text") {
    return (
      <div className="flex flex-col">
        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          CodLabStudio
        </span>
        {showTagline && (
          <span className="text-xs text-gray-500 mt-0.5">
            Code. Lab. Collaborate.
          </span>
        )}
      </div>
    );
  }

  // Full logo (default)
  return (
    <div className={`${sizeClasses[size]} flex items-center gap-2`}>
      <Image
        src="/logo.svg"
        alt="CodLabStudio"
        width={200}
        height={60}
        className="h-full w-auto"
        priority
      />
      {showTagline && (
        <p className="text-xs text-gray-500 ml-2 hidden md:block">
          Code. Lab. Collaborate.
        </p>
      )}
    </div>
  );
}

