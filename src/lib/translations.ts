// Simple translation system for English and Tagalog

export type Language = "en" | "tl"

export const translations = {
  // Navigation
  "nav.dashboard": { en: "Home", tl: "Bahay" },
  "nav.birds": { en: "Birds", tl: "Mga Manok" },
  "nav.eggs": { en: "Eggs", tl: "Mga Itlog" },
  "nav.health": { en: "Health", tl: "Kalusugan" },
  "nav.feed": { en: "Feed", tl: "Pagkain" },
  "nav.coops": { en: "Coops", tl: "Mga Kulungan" },
  "nav.reports": { en: "Reports", tl: "Mga Ulat" },
  "nav.settings": { en: "Settings", tl: "Mga Setting" },

  // Common actions
  "action.add": { en: "Add", tl: "Magdagdag" },
  "action.edit": { en: "Edit", tl: "Baguhin" },
  "action.delete": { en: "Delete", tl: "Tanggalin" },
  "action.save": { en: "Save", tl: "I-save" },
  "action.cancel": { en: "Cancel", tl: "Kanselahin" },
  "action.search": { en: "Search", tl: "Maghanap" },
  "action.filter": { en: "Filter", tl: "Salain" },
  "action.view": { en: "View", tl: "Tingnan" },
  "action.back": { en: "Back", tl: "Bumalik" },
  "action.import": { en: "Import", tl: "Mag-import" },
  "action.export": { en: "Export", tl: "Mag-export" },

  // Bird related
  "bird.title": { en: "Birds", tl: "Mga Manok" },
  "bird.addNew": { en: "Add Bird", tl: "Magdagdag ng Manok" },
  "bird.search": { en: "Find a bird...", tl: "Maghanap ng manok..." },
  "bird.name": { en: "Name", tl: "Pangalan" },
  "bird.sex": { en: "Sex", tl: "Kasarian" },
  "bird.sex.male": { en: "Male", tl: "Lalaki" },
  "bird.sex.female": { en: "Female", tl: "Babae" },
  "bird.sex.unknown": { en: "Unknown", tl: "Hindi alam" },
  "bird.hatchDate": { en: "Hatch Date", tl: "Petsa ng Pagpisa" },
  "bird.age": { en: "Age", tl: "Edad" },
  "bird.status": { en: "Status", tl: "Kalagayan" },
  "bird.status.active": { en: "Active", tl: "Aktibo" },
  "bird.status.sold": { en: "Sold", tl: "Nabenta" },
  "bird.status.deceased": { en: "Deceased", tl: "Patay" },
  "bird.status.archived": { en: "Archived", tl: "Naka-archive" },
  "bird.father": { en: "Father", tl: "Ama" },
  "bird.mother": { en: "Mother", tl: "Ina" },
  "bird.offspring": { en: "Offspring", tl: "Mga Anak" },
  "bird.coop": { en: "Coop", tl: "Kulungan" },
  "bird.breed": { en: "Breed", tl: "Lahi" },
  "bird.bandNumber": { en: "Band Number", tl: "Numero ng Band" },
  "bird.bandColor": { en: "Band Color", tl: "Kulay ng Band" },
  "bird.wingBand": { en: "Wing Band", tl: "Band sa Pakpak" },
  "bird.notes": { en: "Notes", tl: "Mga Tala" },
  "bird.photos": { en: "Photos", tl: "Mga Larawan" },

  // Egg related
  "egg.title": { en: "Eggs", tl: "Mga Itlog" },
  "egg.addNew": { en: "Record Egg", tl: "Magtala ng Itlog" },
  "egg.date": { en: "Date", tl: "Petsa" },
  "egg.mark": { en: "Egg Mark", tl: "Marka ng Itlog" },
  "egg.weight": { en: "Weight (g)", tl: "Timbang (g)" },
  "egg.quality": { en: "Shell Quality", tl: "Kalidad ng Balat" },
  "egg.quality.good": { en: "Good", tl: "Mabuti" },
  "egg.quality.fair": { en: "Fair", tl: "Katamtaman" },
  "egg.quality.poor": { en: "Poor", tl: "Mahina" },
  "egg.quality.soft": { en: "Soft", tl: "Malambot" },
  "egg.incubating": { en: "Incubating", tl: "Pinipisa" },
  "egg.hatched": { en: "Hatched", tl: "Napisa" },

  // Weight related
  "weight.title": { en: "Weight", tl: "Timbang" },
  "weight.record": { en: "Record Weight", tl: "Magtala ng Timbang" },
  "weight.grams": { en: "Weight (grams)", tl: "Timbang (gramo)" },
  "weight.milestone": { en: "Milestone", tl: "Milestone" },

  // Health related
  "health.title": { en: "Health", tl: "Kalusugan" },
  "health.vaccinations": { en: "Vaccinations", tl: "Mga Bakuna" },
  "health.incidents": { en: "Health Issues", tl: "Mga Problema sa Kalusugan" },
  "health.medications": { en: "Medications", tl: "Mga Gamot" },
  "health.vaccine": { en: "Vaccine", tl: "Bakuna" },
  "health.dateGiven": { en: "Date Given", tl: "Petsa Ibinigay" },
  "health.nextDue": { en: "Next Due", tl: "Susunod na Due" },
  "health.symptoms": { en: "Symptoms", tl: "Mga Sintomas" },
  "health.diagnosis": { en: "Diagnosis", tl: "Diagnosis" },
  "health.treatment": { en: "Treatment", tl: "Paggamot" },
  "health.outcome": { en: "Outcome", tl: "Resulta" },
  "health.outcome.recovered": { en: "Recovered", tl: "Gumaling" },
  "health.outcome.ongoing": { en: "Ongoing", tl: "Nagpapatuloy" },
  "health.outcome.deceased": { en: "Deceased", tl: "Namatay" },

  // Feed related
  "feed.title": { en: "Feed", tl: "Pagkain" },
  "feed.inventory": { en: "Feed Stock", tl: "Stock ng Pagkain" },
  "feed.consumption": { en: "Feed Used", tl: "Pagkain na Ginamit" },
  "feed.type": { en: "Feed Type", tl: "Uri ng Pagkain" },
  "feed.type.starter": { en: "Starter", tl: "Starter" },
  "feed.type.grower": { en: "Grower", tl: "Grower" },
  "feed.type.layer": { en: "Layer", tl: "Layer" },
  "feed.type.breeder": { en: "Breeder", tl: "Breeder" },
  "feed.quantity": { en: "Quantity (kg)", tl: "Dami (kg)" },
  "feed.lowStock": { en: "Low Stock", tl: "Mababang Stock" },

  // Coop related
  "coop.title": { en: "Coops", tl: "Mga Kulungan" },
  "coop.addNew": { en: "Add Coop", tl: "Magdagdag ng Kulungan" },
  "coop.name": { en: "Coop Name", tl: "Pangalan ng Kulungan" },
  "coop.capacity": { en: "Capacity", tl: "Kapasidad" },
  "coop.current": { en: "Current", tl: "Kasalukuyan" },
  "coop.type": { en: "Type", tl: "Uri" },

  // Dashboard
  "dashboard.title": { en: "Dashboard", tl: "Dashboard" },
  "dashboard.welcome": { en: "Welcome", tl: "Maligayang pagdating" },
  "dashboard.totalBirds": { en: "Total Birds", tl: "Kabuuang Manok" },
  "dashboard.males": { en: "Males", tl: "Mga Lalaki" },
  "dashboard.females": { en: "Females", tl: "Mga Babae" },
  "dashboard.eggsThisWeek": { en: "Eggs This Week", tl: "Itlog Ngayong Linggo" },
  "dashboard.recentDeaths": { en: "Recent Deaths", tl: "Mga Kamakailang Namatay" },
  "dashboard.alerts": { en: "Alerts", tl: "Mga Alerto" },
  "dashboard.quickActions": { en: "Quick Actions", tl: "Mabilisang Aksyon" },

  // Reports
  "report.title": { en: "Reports", tl: "Mga Ulat" },
  "report.production": { en: "Production", tl: "Produksyon" },
  "report.genetics": { en: "Family Tree", tl: "Family Tree" },
  "report.health": { en: "Health Report", tl: "Ulat ng Kalusugan" },

  // Settings
  "settings.title": { en: "Settings", tl: "Mga Setting" },
  "settings.language": { en: "Language", tl: "Wika" },
  "settings.account": { en: "Account", tl: "Account" },
  "settings.logout": { en: "Log Out", tl: "Mag-log out" },

  // Common words
  "common.today": { en: "Today", tl: "Ngayon" },
  "common.yesterday": { en: "Yesterday", tl: "Kahapon" },
  "common.thisWeek": { en: "This Week", tl: "Ngayong Linggo" },
  "common.thisMonth": { en: "This Month", tl: "Ngayong Buwan" },
  "common.all": { en: "All", tl: "Lahat" },
  "common.none": { en: "None", tl: "Wala" },
  "common.yes": { en: "Yes", tl: "Oo" },
  "common.no": { en: "No", tl: "Hindi" },
  "common.loading": { en: "Loading...", tl: "Naglo-load..." },
  "common.error": { en: "Error", tl: "Error" },
  "common.success": { en: "Success", tl: "Tagumpay" },
  "common.notFound": { en: "Not found", tl: "Hindi nahanap" },
  "common.noData": { en: "No data yet", tl: "Wala pang data" },

  // Time
  "time.days": { en: "days", tl: "araw" },
  "time.weeks": { en: "weeks", tl: "linggo" },
  "time.months": { en: "months", tl: "buwan" },
  "time.years": { en: "years", tl: "taon" },
  "time.old": { en: "old", tl: "gulang" },

  // Conditioning/Exercise (Sabong)
  "conditioning.title": { en: "Conditioning", tl: "Kondisyoning" },
  "conditioning.exercise": { en: "Exercise", tl: "Ehersisyo" },
  "conditioning.exerciseType": { en: "Exercise Type", tl: "Uri ng Ehersisyo" },
  "conditioning.addExercise": { en: "Add Exercise", tl: "Magdagdag ng Ehersisyo" },
  "conditioning.record": { en: "Record Exercise", tl: "Magtala ng Ehersisyo" },
  "conditioning.duration": { en: "Duration (minutes)", tl: "Tagal (minuto)" },
  "conditioning.intensity": { en: "Intensity", tl: "Intensity" },
  "conditioning.intensity.light": { en: "Light", tl: "Magaan" },
  "conditioning.intensity.medium": { en: "Medium", tl: "Katamtaman" },
  "conditioning.intensity.hard": { en: "Hard", tl: "Malakas" },
  "conditioning.history": { en: "Exercise History", tl: "Kasaysayan ng Ehersisyo" },
  "conditioning.sparring": { en: "Sparring", tl: "Sparring" },
  "conditioning.running": { en: "Running", tl: "Pagtakbo" },
  "conditioning.cordWork": { en: "Cord Work", tl: "Cord Work" },
  "conditioning.flying": { en: "Flying", tl: "Paglipad" },
  "conditioning.rest": { en: "Rest Day", tl: "Pahinga" },

  // Fight Records (Sabong)
  "fights.title": { en: "Fight Records", tl: "Rekord ng Laban" },
  "fights.addFight": { en: "Add Fight", tl: "Magdagdag ng Laban" },
  "fights.record": { en: "Record Fight", tl: "Magtala ng Laban" },
  "fights.outcome": { en: "Outcome", tl: "Resulta" },
  "fights.outcome.win": { en: "Win", tl: "Panalo" },
  "fights.outcome.loss": { en: "Loss", tl: "Talo" },
  "fights.outcome.draw": { en: "Draw", tl: "Draw" },
  "fights.location": { en: "Location/Derby", tl: "Lugar/Derby" },
  "fights.winRecord": { en: "Win Record", tl: "Rekord ng Panalo" },
  "fights.totalFights": { en: "Total Fights", tl: "Kabuuang Laban" },
  "fights.winPercentage": { en: "Win %", tl: "Porsyento ng Panalo" },

  // Egg Sizes
  "eggSize.title": { en: "Egg Size Categories", tl: "Mga Kategorya ng Laki ng Itlog" },
  "egg.size": { en: "Egg Size", tl: "Laki ng Itlog" },
  "egg.size.small": { en: "Small", tl: "Maliit" },
  "egg.size.medium": { en: "Medium", tl: "Katamtaman" },
  "egg.size.large": { en: "Large", tl: "Malaki" },
  "egg.size.xl": { en: "Extra Large", tl: "Napakalaki" },
  "egg.sizeCategories": { en: "Size Categories", tl: "Mga Kategorya ng Laki" },
  "egg.addSize": { en: "Add Size Category", tl: "Magdagdag ng Kategorya" },

  // Feed Stages
  "feedStage.title": { en: "Feed Stages", tl: "Mga Yugto ng Pagkain" },
  "feed.stage": { en: "Feed Stage", tl: "Yugto ng Pagkain" },
  "feed.stage.starter": { en: "Starter", tl: "Starter" },
  "feed.stage.grower": { en: "Grower", tl: "Grower" },
  "feed.stage.finisher": { en: "Finisher", tl: "Finisher" },
  "feed.stage.breeder": { en: "Breeder", tl: "Breeder" },
  "feed.ageRange": { en: "Age Range", tl: "Saklaw ng Edad" },
  "feed.recommended": { en: "Recommended Feed", tl: "Inirerekumendang Pagkain" },
  "feed.stageConfig": { en: "Feed Stage Configuration", tl: "Konpigurasyon ng Yugto" },

  // Offspring
  "offspring.title": { en: "Offspring", tl: "Mga Anak" },
  "offspring.total": { en: "Total Offspring", tl: "Kabuuang Anak" },
  "offspring.males": { en: "Male Offspring", tl: "Mga Lalaking Anak" },
  "offspring.females": { en: "Female Offspring", tl: "Mga Babaeng Anak" },
  "offspring.unknown": { en: "Unknown Sex", tl: "Hindi Alam ang Kasarian" },
  "offspring.override": { en: "Manual Count", tl: "Manual na Bilang" },
  "offspring.calculated": { en: "Auto-calculated", tl: "Awtomatikong Kinalkula" },

  // Export
  "export.title": { en: "Export Data", tl: "Mag-export ng Data" },
  "export.description": { en: "Download your data in CSV format", tl: "I-download ang iyong data sa format na CSV" },
  "export.birds": { en: "Export Birds", tl: "I-export ang mga Ibon" },
  "export.birdsDesc": { en: "Download all bird records with their details", tl: "I-download ang lahat ng rekord ng ibon" },
  "export.weights": { en: "Export Weight Records", tl: "I-export ang mga Tala ng Timbang" },
  "export.weightsDesc": { en: "Download weight tracking history", tl: "I-download ang kasaysayan ng timbang" },
  "export.eggs": { en: "Export Egg Records", tl: "I-export ang mga Tala ng Itlog" },
  "export.eggsDesc": { en: "Download egg collection records", tl: "I-download ang mga tala ng itlog" },
  "export.vaccinations": { en: "Export Vaccinations", tl: "I-export ang mga Bakuna" },
  "export.vaccinationsDesc": { en: "Download vaccination records", tl: "I-download ang mga tala ng bakuna" },
  "export.healthIncidents": { en: "Export Health Incidents", tl: "I-export ang mga Problema sa Kalusugan" },
  "export.healthIncidentsDesc": { en: "Download health incident records", tl: "I-download ang mga tala ng problema sa kalusugan" },
  "export.fights": { en: "Export Fight Records", tl: "I-export ang mga Rekord ng Laban" },
  "export.fightsDesc": { en: "Download fight history records", tl: "I-download ang kasaysayan ng laban" },
  "export.templates": { en: "Import Templates", tl: "Mga Template para sa Pag-import" },
  "export.templatesDesc": { en: "Download blank CSV templates for data entry", tl: "I-download ang mga blankong template para sa paglalagay ng data" },
  "export.downloadTemplate": { en: "Download Template", tl: "I-download ang Template" },
  "export.download": { en: "Download", tl: "I-download" },
  "export.downloading": { en: "Downloading...", tl: "Nagda-download..." },
  "export.noData": { en: "No data to export", tl: "Walang data na mai-export" },
  "export.dateRange": { en: "Date Range", tl: "Saklaw ng Petsa" },
  "export.startDate": { en: "Start Date", tl: "Petsa ng Simula" },
  "export.endDate": { en: "End Date", tl: "Petsa ng Wakas" },
  "export.filterByStatus": { en: "Filter by Status", tl: "Salain ayon sa Kalagayan" },
  "export.filterByOutcome": { en: "Filter by Outcome", tl: "Salain ayon sa Resulta" },
  "export.allStatuses": { en: "All Statuses", tl: "Lahat ng Kalagayan" },
  "export.allOutcomes": { en: "All Outcomes", tl: "Lahat ng Resulta" },
} as const

export type TranslationKey = keyof typeof translations

export function t(key: TranslationKey, lang: Language = "en"): string {
  const translation = translations[key]
  if (!translation) {
    console.warn(`Missing translation for key: ${key}`)
    return key
  }
  return translation[lang] || translation.en
}

// Format age in a friendly way
export function formatAge(days: number, lang: Language = "en"): string {
  if (days < 7) {
    return `${days} ${t("time.days", lang)} ${t("time.old", lang)}`
  }
  const weeks = Math.floor(days / 7)
  const remainingDays = days % 7
  if (weeks < 12) {
    return remainingDays > 0
      ? `${weeks}w ${remainingDays}d ${t("time.old", lang)}`
      : `${weeks} ${t("time.weeks", lang)} ${t("time.old", lang)}`
  }
  const months = Math.floor(days / 30)
  if (months < 24) {
    return `${months} ${t("time.months", lang)} ${t("time.old", lang)}`
  }
  const years = Math.floor(days / 365)
  return `${years} ${t("time.years", lang)} ${t("time.old", lang)}`
}
