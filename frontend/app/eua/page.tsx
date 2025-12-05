"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGuestSession } from "@/utils/guestSession";
import Logo from "@/components/Brand/Logo";

interface EUACheckbox {
  id: string;
  label: string;
  required: boolean;
  content: string;
}

const EUA_SECTIONS: EUACheckbox[] = [
  {
    id: "ai-governance",
    label: "AI Usage Governance",
    required: true,
    content: "I understand that this tool uses AI technologies and agree to use them responsibly. I will not use AI-generated content to mislead, harm, or violate any laws or regulations.",
  },
  {
    id: "responsible-ai",
    label: "Responsible AI Use",
    required: true,
    content: "I agree to use AI features ethically and responsibly. I will not use this tool to generate harmful, illegal, or unethical content. I understand that misuse may result in access termination.",
  },
  {
    id: "intended-use",
    label: "Intended Use Only",
    required: true,
    content: "I agree to use this tool only for its intended purposes. I will not attempt to circumvent security measures, access unauthorized data, or use this tool for any malicious purposes.",
  },
  {
    id: "usage-monitoring",
    label: "Usage Monitoring and Data Collection",
    required: true,
    content: "I understand that my usage is monitored for quality assurance, security, and system improvement purposes. All actions are logged per session. Guest sessions are temporary and data is cleared at session end.",
  },
  {
    id: "no-persistence",
    label: "No Data Persistence (Guest Mode)",
    required: true,
    content: "I understand that in guest mode, my work is not permanently saved. I should download or save my work locally if I wish to retain it beyond this session.",
  },
  {
    id: "liability",
    label: "Liability and Disclaimer",
    required: true,
    content: "I understand that this tool is provided 'as is' without warranties. I am responsible for the code I write and execute. The tool providers are not liable for any damages resulting from use of this tool.",
  },
];

export default function EUAPage() {
  const router = useRouter();
  const [agreements, setAgreements] = useState<Record<string, boolean>>({});
  const [allAccepted, setAllAccepted] = useState(false);

  const handleCheckboxChange = (id: string, checked: boolean) => {
    const newAgreements = { ...agreements, [id]: checked };
    setAgreements(newAgreements);

    // Check if all required sections are accepted
    const allRequiredAccepted = EUA_SECTIONS.every(
      (section) => !section.required || newAgreements[section.id] === true
    );
    setAllAccepted(allRequiredAccepted);
  };

  const handleAccept = async () => {
    if (!allAccepted) {
      return;
    }

    // Store EUA acceptance in sessionStorage (per-session)
    sessionStorage.setItem("euaAccepted", "true");
    sessionStorage.setItem("euaAcceptedAt", new Date().toISOString());
    sessionStorage.setItem("euaAcceptedSections", JSON.stringify(agreements));

    // Set guest mode and create session
    localStorage.setItem("guestMode", "true");
    await createGuestSession().catch(console.error);

    // Redirect to onboarding
    router.push("/onboarding");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <Logo variant="full" size="md" />
          </div>
          <h1 className="text-3xl font-bold text-center mb-4">
            End User Agreement
          </h1>
          <p className="text-center text-gray-600">
            Please read and accept all terms to continue using CodLabStudio
          </p>
        </div>

        <div className="space-y-6 mb-8">
          {EUA_SECTIONS.map((section) => (
            <div
              key={section.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id={section.id}
                  checked={agreements[section.id] || false}
                  onChange={(e) =>
                    handleCheckboxChange(section.id, e.target.checked)
                  }
                  className="mt-1 h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  required={section.required}
                />
                <div className="flex-1">
                  <label
                    htmlFor={section.id}
                    className="block text-sm font-semibold text-gray-900 mb-2 cursor-pointer"
                  >
                    {section.label}
                    {section.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">
                {Object.values(agreements).filter(Boolean).length} of{" "}
                {EUA_SECTIONS.length}
              </span>{" "}
              sections accepted
            </div>
            {!allAccepted && (
              <div className="text-sm text-red-600 font-medium">
                All sections must be accepted to continue
              </div>
            )}
          </div>

          <button
            onClick={handleAccept}
            disabled={!allAccepted}
            className={`w-full py-3 px-6 rounded-md font-medium transition-colors ${
              allAccepted
                ? "bg-primary-600 text-white hover:bg-primary-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {allAccepted
              ? "Accept All Terms and Continue"
              : "Accept All Terms to Continue"}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            By clicking "Accept All Terms and Continue", you acknowledge that you
            have read, understood, and agree to be bound by all the terms and
            conditions above.
          </p>
        </div>
      </div>
    </div>
  );
}

