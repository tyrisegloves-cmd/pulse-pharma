"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  AlertCircle,
  KeyRound,
  Loader2,
} from "lucide-react";
import { AccountSidebar, AuthGate } from "@/components/AccountSidebar";
import { useAuth } from "@/components/AuthContext";
import { getMyProfile, updateMyProfile } from "@/services/profiles";
import type { Profile } from "@/services/types";
import {
  validatePassword,
  passwordsMatch,
  validateFullName,
} from "@/lib/auth-validation";

type Feedback = { type: "success" | "error"; message: string } | null;

function Banner({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  const Icon = feedback.type === "success" ? CheckCircle : AlertCircle;
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg mb-6 ${
        feedback.type === "success"
          ? "bg-green-50 border border-green-100 text-green-700"
          : "bg-red-50 border border-red-100 text-red-700"
      }`}
    >
      <Icon className="flex-shrink-0 mt-0.5" size={18} />
      <p className="text-sm">{feedback.message}</p>
    </div>
  );
}

const inputClass =
  "w-full border border-gray-200 bg-gray-50 rounded-lg py-3 pl-11 pr-4 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors";

function SettingsContent() {
  const { user, updatePassword } = useAuth();

  /* ── Profile state ── */
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<Feedback>(null);

  /* ── Password state ── */
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [passSaving, setPassSaving] = useState(false);
  const [passFeedback, setPassFeedback] = useState<Feedback>(null);

  // Load the profile once authenticated.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setProfileLoading(true);
      const { data, error } = await getMyProfile();
      if (cancelled) return;
      if (error || !data) {
        setProfileFeedback({
          type: "error",
          message: error ?? "We couldn't load your profile right now.",
        });
      } else {
        setProfile(data);
        setFullName(data.fullName);
        setPhone(data.phone);
      }
      setProfileLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFeedback(null);

    const nameErr = validateFullName(fullName);
    if (nameErr) {
      setProfileFeedback({ type: "error", message: nameErr });
      return;
    }

    setProfileSaving(true);
    const { data, error } = await updateMyProfile({
      fullName: fullName.trim(),
      phone: phone.trim(),
    });
    setProfileSaving(false);

    if (error || !data) {
      setProfileFeedback({
        type: "error",
        message: error ?? "We couldn't save your changes. Please try again.",
      });
      return;
    }
    setProfile(data);
    setFullName(data.fullName);
    setPhone(data.phone);
    setProfileFeedback({
      type: "success",
      message: "Your profile has been updated.",
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassFeedback(null);

    const passErr = validatePassword(newPass);
    if (passErr) {
      setPassFeedback({ type: "error", message: passErr });
      return;
    }
    const matchErr = passwordsMatch(newPass, confirmPass);
    if (matchErr) {
      setPassFeedback({ type: "error", message: matchErr });
      return;
    }

    setPassSaving(true);
    const { error } = await updatePassword(newPass);
    setPassSaving(false);

    if (error) {
      setPassFeedback({
        type: "error",
        message:
          "We couldn't update your password. Please try again or sign out and back in.",
      });
      return;
    }
    setNewPass("");
    setConfirmPass("");
    setPassFeedback({
      type: "success",
      message: "Your password has been updated.",
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        <div className="flex flex-col md:flex-row gap-8">
          <AccountSidebar active="settings" />

          <div className="flex-grow max-w-2xl">
            {/* Profile section */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Profile Details
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Update the name and phone number shown on your account.
              </p>

              <Banner feedback={profileFeedback} />

              {profileLoading ? (
                <div className="space-y-4">
                  <div className="h-11 bg-gray-100 rounded-lg animate-pulse" />
                  <div className="h-11 bg-gray-100 rounded-lg animate-pulse" />
                  <div className="h-11 bg-gray-100 rounded-lg animate-pulse" />
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="email"
                        value={profile?.email ?? user?.email ?? ""}
                        disabled
                        className={`${inputClass} opacity-60 cursor-not-allowed`}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Email can&apos;t be changed here. Contact support to update it.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        autoComplete="name"
                        className={inputClass}
                        placeholder="Your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        autoComplete="tel"
                        className={inputClass}
                        placeholder="+233 20 123 4567"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {profileSaving ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    {profileSaving ? "Saving…" : "Save Changes"}
                  </button>
                </form>
              )}
            </div>

            {/* Change password section */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                <KeyRound size={20} className="text-red-600" />
                Change Password
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Choose a strong new password. You&apos;ll use it the next time
                you sign in.
              </p>

              <Banner feedback={passFeedback} />

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type={showPass ? "text" : "password"}
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      autoComplete="new-password"
                      className={`${inputClass} pr-11`}
                      placeholder="Min. 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((s) => !s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Toggle password visibility"
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type={showPass ? "text" : "password"}
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      autoComplete="new-password"
                      className={inputClass}
                      placeholder="Re-enter your new password"
                    />
                  </div>
                </div>

                <ul className="text-xs text-gray-400 space-y-1 pl-5 list-disc">
                  <li>At least 8 characters</li>
                  <li>Upper &amp; lower case letters</li>
                  <li>At least one number</li>
                </ul>

                <button
                  type="submit"
                  disabled={passSaving}
                  className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {passSaving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Lock size={18} />
                  )}
                  {passSaving ? "Updating…" : "Update Password"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthGate>
      <SettingsContent />
    </AuthGate>
  );
}
