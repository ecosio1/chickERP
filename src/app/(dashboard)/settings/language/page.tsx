"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Globe,
  ArrowLeft,
  Check,
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"

export default function LanguageSettingsPage() {
  const { language, setLanguage, t } = useLanguage()

  const languages = [
    {
      code: "en",
      name: "English",
      nativeName: "English",
      flag: "🇺🇸",
    },
    {
      code: "tl",
      name: "Tagalog",
      nativeName: "Tagalog",
      flag: "🇵🇭",
    },
  ]

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
            {t("settings.language")}
          </h1>
          <p className="text-muted-foreground">
            Choose your preferred language
          </p>
        </div>
      </div>

      {/* Language Options */}
      <Card className="card-warm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Globe className="h-5 w-5 text-orange-500" />
            Select Language
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code as "en" | "tl")}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                language === lang.code
                  ? "bg-orange-100 border-2 border-orange-300"
                  : "bg-orange-50 hover:bg-orange-100 border-2 border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{lang.flag}</span>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">{lang.name}</p>
                  <p className="text-sm text-muted-foreground">{lang.nativeName}</p>
                </div>
              </div>
              {language === lang.code && (
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <Check className="h-5 w-5 text-white" />
                </div>
              )}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="card-warm">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            {language === "en"
              ? "The language setting affects all text displayed in the application. Some content like bird names and notes will remain in their original language."
              : "Ang setting ng wika ay nakakaapekto sa lahat ng teksto na ipinapakita sa application. Ang ilang nilalaman tulad ng mga pangalan ng ibon at mga tala ay mananatili sa kanilang orihinal na wika."}
          </p>
        </CardContent>
      </Card>

      {/* Spacer for mobile */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}
