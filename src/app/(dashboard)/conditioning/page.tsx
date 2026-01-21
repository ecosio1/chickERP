"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dumbbell,
  Plus,
  Bird,
  ChevronRight,
  Calendar,
  Clock,
  Settings,
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { cn } from "@/lib/utils"

interface ExerciseRecord {
  id: string
  date: string
  durationMinutes: number | null
  intensity: string | null
  notes: string | null
  bird: {
    id: string
    name: string | null
    identifiers: Array<{ idType: string; idValue: string }>
  }
  exerciseType: {
    id: string
    name: string
    nameTl: string | null
  }
}

interface ExerciseType {
  id: string
  name: string
  nameTl: string | null
}

export default function ConditioningPage() {
  const { t, language } = useLanguage()
  const [recentExercises, setRecentExercises] = useState<ExerciseRecord[]>([])
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [exercisesRes, typesRes] = await Promise.all([
          fetch("/api/conditioning/records?limit=20"),
          fetch("/api/conditioning/types"),
        ])

        if (exercisesRes.ok) {
          const json = await exercisesRes.json()
          setRecentExercises(json.records || [])
        }
        if (typesRes.ok) {
          const json = await typesRes.json()
          setExerciseTypes(json.types || [])
        }
      } catch (error) {
        console.error("Failed to fetch conditioning data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getDisplayId = (bird: ExerciseRecord["bird"]) => {
    return bird.identifiers[0]?.idValue || bird.name || bird.id.slice(-6)
  }

  const getTypeName = (type: ExerciseType) => {
    return language === "tl" && type.nameTl ? type.nameTl : type.name
  }

  const getIntensityColor = (intensity: string | null) => {
    switch (intensity) {
      case "Light":
        return "bg-green-100 text-green-700"
      case "Medium":
        return "bg-yellow-100 text-yellow-700"
      case "Hard":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-orange-100 rounded-xl w-48" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 bg-orange-50 rounded-2xl" />
            <div className="h-32 bg-orange-50 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
            {t("conditioning.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            Track exercise and conditioning for your roosters
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/settings/exercises">
            <Button variant="outline" className="rounded-xl border-2 border-orange-100">
              <Settings className="h-4 w-4 mr-2" />
              Manage Types
            </Button>
          </Link>
          <Link href="/conditioning/record">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
              <Plus className="h-5 w-5 mr-2" />
              {t("conditioning.record")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Exercise Types Quick Stats */}
      {exerciseTypes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {exerciseTypes.slice(0, 4).map((type) => (
            <Card key={type.id} className="card-warm">
              <CardContent className="p-4 text-center">
                <Dumbbell className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                <p className="font-semibold text-gray-800">{getTypeName(type)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Activity */}
      <Card className="card-warm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-orange-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentExercises.length > 0 ? (
            <div className="space-y-3">
              {recentExercises.map((record) => (
                <Link
                  key={record.id}
                  href={`/birds/${record.bird.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-orange-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Bird className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {getDisplayId(record.bird)}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{getTypeName(record.exerciseType)}</span>
                        {record.intensity && (
                          <span className={cn("px-2 py-0.5 rounded-full text-xs", getIntensityColor(record.intensity))}>
                            {record.intensity}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(record.date).toLocaleDateString()}
                    </div>
                    {record.durationMinutes && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {record.durationMinutes} min
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Dumbbell className="h-12 w-12 mx-auto text-orange-200 mb-3" />
              <p className="text-muted-foreground mb-4">{t("common.noData")}</p>
              <Link href="/conditioning/record">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("conditioning.record")}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spacer for mobile bottom nav */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}
