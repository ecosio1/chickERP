"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  User,
  ArrowLeft,
  Mail,
  Shield,
  Calendar,
  LogOut,
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { useSession, signOut } from "next-auth/react"

export default function AccountSettingsPage() {
  const { t } = useLanguage()
  const { data: session } = useSession()

  return (
    <div className="p-4 lg:p-8 space-y-6 page-transition">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
            Account Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account information
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="card-warm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <User className="h-5 w-5 text-orange-500" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
              <span className="text-2xl font-bold text-orange-600">
                {session?.user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-800">{session?.user?.name}</p>
              <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-medium rounded-full capitalize">
                {session?.user?.role?.toLowerCase()}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{session?.user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <Shield className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="font-medium capitalize">{session?.user?.role?.toLowerCase()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card className="card-warm border-red-100">
        <CardContent className="p-4">
          <Button
            variant="outline"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full h-12 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-5 w-5 mr-2" />
            {t("settings.logout")}
          </Button>
        </CardContent>
      </Card>

      {/* Spacer for mobile */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}
