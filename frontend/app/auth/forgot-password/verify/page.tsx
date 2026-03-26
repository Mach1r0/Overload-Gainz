"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function VerifyCodePage() {
  const router = useRouter()

  useEffect(() => {
    const uid = sessionStorage.getItem("reset_uid")
    const token = sessionStorage.getItem("reset_token")
    if (uid && token) {
      router.replace("/auth/forgot-password/reset")
    } else {
      router.replace("/auth/forgot-password")
    }
  }, [router])

  return null
}
