"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Settings,
  Dumbbell,
  Egg,
  Wheat,
  Globe,
  User,
  ChevronRight,
  Dna,
  Building2,
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { useAuth } from "@/components/providers/auth-provider"

const settingsSections = [
  {
    title: "Configuration",
    items: [
      {
        name: "Exercise Types",
        nameTl: "Uri ng Ehersisyo",
        description: "Manage conditioning exercise types for sabong",
        descriptionTl: "Pamahalaan ang mga uri ng ehersisyo para sa kondisyoning",
        href: "/settings/exercises",
        icon: Dumbbell,
        color: "bg-purple-100 text-purple-600",
      },
      {
        name: "Egg Size Categories",
        nameTl: "Kategorya ng Laki ng Itlog",
        description: "Define egg size classifications",
        descriptionTl: "Tukuyin ang mga klasipikasyon ng laki ng itlog",
        href: "/settings/egg-sizes",
        icon: Egg,
        color: "bg-amber-100 text-amber-600",
      },
      {
        name: "Feed Stages",
        nameTl: "Mga Yugto ng Pagkain",
        description: "Configure feed types by bird age",
        descriptionTl: "I-configure ang mga uri ng pagkain ayon sa edad ng ibon",
        href: "/settings/feed-stages",
        icon: Wheat,
        color: "bg-green-100 text-green-600",
      },
      {
        name: "Breeds",
        nameTl: "Mga Breed",
        description: "Manage chicken breeds for genetics tracking",
        descriptionTl: "Pamahalaan ang mga breed ng manok para sa pagsubaybay ng genetics",
        href: "/settings/breeds",
        icon: Dna,
        color: "bg-purple-100 text-purple-600",
      },
      {
        name: "Source Farms",
        nameTl: "Mga Pinagmulang Farm",
        description: "Manage farms where breeds are sourced from",
        descriptionTl: "Pamahalaan ang mga farm kung saan nagmula ang mga breed",
        href: "/settings/source-farms",
        icon: Building2,
        color: "bg-teal-100 text-teal-600",
      },
    ],
  },
  {
    title: "Preferences",
    items: [
      {
        name: "Language",
        nameTl: "Wika",
        description: "Switch between English and Tagalog",
        descriptionTl: "Lumipat sa pagitan ng Ingles at Tagalog",
        href: "/settings/language",
        icon: Globe,
        color: "bg-blue-100 text-blue-600",
      },
      {
        name: "Account",
        nameTl: "Account",
        description: "Manage your account settings",
        descriptionTl: "Pamahalaan ang iyong account settings",
        href: "/settings/account",
        icon: User,
        color: "bg-gray-100 text-gray-600",
      },
    ],
  },
]

export default function SettingsPage() {
  const { t, language } = useLanguage()
  const { profile } = useAuth()

  return (
    <div className="p-4 lg:p-8 space-y-6 page-transition">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
          {t("nav.settings")}
        </h1>
        <p className="text-muted-foreground">
          Configure your ChickERP application
        </p>
      </div>

      {/* User Info Card */}
      <Card className="card-warm">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
            <span className="text-2xl font-bold text-orange-600">
              {profile?.name?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-800">{profile?.name}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-medium rounded-full capitalize">
              {profile?.role?.toLowerCase()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Settings Sections */}
      {settingsSections.map((section) => (
        <div key={section.title}>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            {section.title}
          </h2>
          <Card className="card-warm">
            <CardContent className="p-0 divide-y divide-orange-100">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between p-4 hover:bg-orange-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {language === "tl" ? item.nameTl : item.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language === "tl" ? item.descriptionTl : item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}

      {/* App Info */}
      <Card className="card-warm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Settings className="h-5 w-5 text-orange-500" />
            About ChickERP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Environment</span>
            <span className="font-medium">Development</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Database</span>
            <span className="font-medium">PostgreSQL</span>
          </div>
        </CardContent>
      </Card>

      {/* Spacer for mobile */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}
