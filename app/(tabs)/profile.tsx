"use client"

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
  SafeAreaView,
} from "react-native"
import { useRouter } from "expo-router"
import { ArrowLeft, Check, Edit2, LogOut } from "lucide-react-native"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { LinearGradient } from "expo-linear-gradient"

export default function Profile() {
  const [username, setUsername] = useState("")
  const [editingUsername, setEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingUsername, setSavingUsername] = useState(false)

  const router = useRouter()

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) throw sessionError
      if (!session) {
        router.push("/")
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", session.user.id)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError
      }

      if (profileData?.display_name) {
        setUsername(profileData.display_name)
        setNewUsername(profileData.display_name)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      Alert.alert("Error", "Failed to load profile information")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveUsername = async () => {
    if (!newUsername.trim()) {
      Alert.alert("Error", "Username cannot be empty")
      return
    }

    try {
      setSavingUsername(true)
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) throw sessionError
      if (!session) {
        Alert.alert("Error", "You must be logged in to update your profile")
        return
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ display_name: newUsername.trim() })
        .eq("user_id", session.user.id)

      if (updateError) throw updateError

      setUsername(newUsername.trim())
      setEditingUsername(false)
      Alert.alert("Success", "Username updated successfully")
    } catch (error) {
      console.error("Error updating username:", error)
      Alert.alert("Error", "Failed to update username")
    } finally {
      setSavingUsername(false)
    }
  }

  const handleLogout = async () => {
    try {
      setShowLogoutConfirm(false)
      const { error } = await supabase.auth.signOut()
      if (error) {
        Alert.alert("Error", "Failed to log out: " + error.message)
        return
      }
      router.push("/")
    } catch (err) {
      console.error("Logout error:", err)
      Alert.alert("Error", "An unexpected error occurred during logout")
    }
  }

  if (loading) {
    return (
      <LinearGradient colors={["#36D1DC", "#5B86E5"]} style={styles.gradientBackground}>
        <SafeAreaView style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </SafeAreaView>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={["#36D1DC", "#5B86E5"]} style={styles.gradientBackground}>
      <SafeAreaView style={styles.container}>
        {/* Matching Invite Members header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push("/dashboard")}>
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: 40,
            gap: 20,
          }}
        >
          <View style={styles.card}>
            {editingUsername ? (
              <View style={styles.editUsernameContainer}>
                <TextInput
                  style={styles.usernameInput}
                  value={newUsername}
                  onChangeText={setNewUsername}
                  autoFocus
                  selectTextOnFocus
                />
                {savingUsername ? (
                  <ActivityIndicator size="small" color="#5E72E4" style={{ marginLeft: 8 }} />
                ) : (
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveUsername}>
                    <Check size={20} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.usernameContainer}>
                <Text style={styles.username}>{username || "Set your name"}</Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    setNewUsername(username)
                    setEditingUsername(true)
                  }}
                >
                  <Edit2 size={16} color="#5E72E4" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Account</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={() => setShowLogoutConfirm(true)}>
              <LogOut size={20} color="#FF3B30" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Modal
          animationType="fade"
          transparent={true}
          visible={showLogoutConfirm}
          onRequestClose={() => setShowLogoutConfirm(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Log Out</Text>
              <Text style={styles.modalMessage}>Are you sure you want to log out?</Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowLogoutConfirm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.modalButton, styles.logoutConfirmButton]} onPress={handleLogout}>
                  <Text style={styles.logoutConfirmText}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  editUsernameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  usernameInput: {
    fontSize: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#5E72E4",
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 150,
    textAlign: "center",
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: "#5E72E4",
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  usernameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  editButton: {
    padding: 4,
  },
  username: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    color: "#FF3B30",
    marginLeft: 12,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    borderRadius: 8,
    padding: 12,
    flex: 0.48,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  logoutConfirmButton: {
    backgroundColor: "#FF3B30",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
  },
  logoutConfirmText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
})
