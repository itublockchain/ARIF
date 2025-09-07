"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

interface KYCStatus {
  isVerified: boolean;
  isLoading: boolean;
  error: string | null;
  inquiryId?: string;
}

export function useKYCStatus() {
  const { address } = useAccount();
  const [status, setStatus] = useState<KYCStatus>({
    isVerified: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!address) {
      setStatus({
        isVerified: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    // Check KYC status from localStorage or API
    const checkKYCStatus = async () => {
      try {
        setStatus((prev) => ({ ...prev, isLoading: true, error: null }));

        // Check localStorage for cached KYC status
        const cachedStatus = localStorage.getItem(`kyc_status_${address}`);
        if (cachedStatus) {
          const parsed = JSON.parse(cachedStatus);
          setStatus({
            isVerified: parsed.isVerified,
            isLoading: false,
            error: null,
            inquiryId: parsed.inquiryId,
          });
          return;
        }

        // TODO: Implement API call to check KYC status
        // For now, we'll assume not verified if not cached
        setStatus({
          isVerified: false,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error checking KYC status:", error);
        setStatus({
          isVerified: false,
          isLoading: false,
          error: "Failed to check KYC status",
        });
      }
    };

    checkKYCStatus();
  }, [address]);

  const updateKYCStatus = (isVerified: boolean, inquiryId?: string) => {
    if (!address) return;

    const newStatus = {
      isVerified,
      isLoading: false,
      error: null,
      inquiryId,
    };

    setStatus(newStatus);

    // Cache the status
    localStorage.setItem(
      `kyc_status_${address}`,
      JSON.stringify({
        isVerified,
        inquiryId,
      })
    );
  };

  return {
    ...status,
    updateKYCStatus,
  };
}
