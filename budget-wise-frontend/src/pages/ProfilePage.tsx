// src/pages/ProfilePage.tsx
import { type FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

export default function ProfilePage() {
  const { user } = useAuth();

  // Local copy of user just for this page so we can show updated name immediately
  const [profileUser, setProfileUser] = useState(user);

  const [name, setName] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [showEditName, setShowEditName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [toast, setToast] = useState<ToastState>(null);

  if (!user) return null;

  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToast({ type, message });
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Open modals

  const openEditName = () => {
    setName(profileUser?.name ?? user.name); // reset to latest known name
    setNameError(null);
    setShowEditName(true);
  };

  const openPasswordModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setShowPasswordModal(true);
  };

  // Handlers

  const handleNameSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNameError(null);

    if (!name.trim()) {
      setNameError("Name cannot be empty.");
      return;
    }

    try {
      setSavingName(true);

      // Update name
      await api.put("/user/me", { name: name.trim() });

      // Fetch fresh user profile to reflect updated name on the page
      const meRes = await api.get("/user/me");
      setProfileUser(meRes.data);

      setShowEditName(false);
      showToast("Name updated successfully", "success");
    } catch (err: any) {
      console.error("Update name error:", err);
      setNameError(err?.response?.data?.error || "Failed to update name.");
    } finally {
      setSavingName(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      setSavingPassword(true);
      await api.put("/user/me", {
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordModal(false);
      showToast("Password updated successfully", "success");
    } catch (err: any) {
      console.error("Update password error:", err);
      setPasswordError(
        err?.response?.data?.error || "Failed to update password."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const displayedUser = profileUser ?? user;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "1rem",
            right: "1rem",
            zIndex: 100,
          }}
        >
          <div
            style={{
              minWidth: "220px",
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              backgroundColor: toast.type === "success" ? "#ecfdf3" : "#fef2f2",
              color: toast.type === "success" ? "#166534" : "#b91c1c",
              border: `1px solid ${
                toast.type === "success" ? "#bbf7d0" : "#fecaca"
              }`,
              boxShadow: "0 10px 30px rgba(15,23,42,0.15)",
              fontSize: "0.9rem",
            }}
          >
            {toast.message}
          </div>
        </div>
      )}

      <h1>Profile</h1>
      <p className="text-muted mt-1">Manage your account details.</p>

      {/* Account info + actions */}
      <div className="card mt-3">
        <h2>Account info</h2>
        <p className="text-muted mt-1">
          These details identify you across your groups.
        </p>

        <div
          style={{
            marginTop: "0.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <div>
            <span className="text-muted">Name</span>
            <div>{displayedUser.name}</div>
          </div>
          <div>
            <span className="text-muted">Email</span>
            <div>{displayedUser.email}</div>
          </div>
        </div>

        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <button type="button" className="btn-primary" onClick={openEditName}>
            Edit name
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={openPasswordModal}
          >
            Update password
          </button>
        </div>
      </div>

      {/* Edit name modal */}
      {showEditName && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 50,
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "420px",
              padding: "1.5rem 1.75rem",
              borderRadius: "12px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              backgroundColor: "white",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.75rem",
              }}
            >
              <h2 style={{ margin: 0 }}>Edit name</h2>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowEditName(false)}
              >
                Close
              </button>
            </div>

            <p className="text-muted" style={{ marginBottom: "0.75rem" }}>
              Update the name shown in the sidebar and in your groups.
            </p>

            <form
              onSubmit={handleNameSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <label
                className="text-muted"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                  fontSize: "0.9rem",
                }}
              >
                <span>Full name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              {nameError && (
                <p style={{ color: "#b91c1c", marginTop: "0.25rem" }}>
                  {nameError}
                </p>
              )}

              <button
                type="submit"
                className="btn-primary mt-1"
                disabled={savingName}
              >
                {savingName ? "Saving..." : "Save name"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Update password modal */}
      {showPasswordModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 50,
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "460px",
              padding: "1.5rem 1.75rem",
              borderRadius: "12px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              backgroundColor: "white",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.75rem",
              }}
            >
              <h2 style={{ margin: 0 }}>Update password</h2>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowPasswordModal(false)}
              >
                Close
              </button>
            </div>

            <p className="text-muted" style={{ marginBottom: "0.75rem" }}>
              Change your password. You&apos;ll need your current password.
            </p>

            <form
              onSubmit={handlePasswordSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <label
                className="text-muted"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                  fontSize: "0.9rem",
                }}
              >
                <span>Current password</span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </label>

              <label
                className="text-muted"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                  fontSize: "0.9rem",
                }}
              >
                <span>New password</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </label>

              <label
                className="text-muted"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                  fontSize: "0.9rem",
                }}
              >
                <span>Confirm new password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>

              {passwordError && (
                <p style={{ color: "#b91c1c", marginTop: "0.25rem" }}>
                  {passwordError}
                </p>
              )}

              <button
                type="submit"
                className="btn-primary mt-1"
                disabled={savingPassword}
              >
                {savingPassword ? "Updating..." : "Update password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
