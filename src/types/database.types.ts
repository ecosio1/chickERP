export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bird_identifiers: {
        Row: {
          bird_id: string
          created_at: string
          id: string
          id_type: string
          id_value: string
          notes: string | null
        }
        Insert: {
          bird_id: string
          created_at?: string
          id?: string
          id_type: string
          id_value: string
          notes?: string | null
        }
        Update: {
          bird_id?: string
          created_at?: string
          id?: string
          id_type?: string
          id_value?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bird_identifiers_bird_id_fkey"
            columns: ["bird_id"]
            isOneToOne: false
            referencedRelation: "birds"
            referencedColumns: ["id"]
          },
        ]
      }
      bird_notes: {
        Row: {
          bird_id: string
          content: string
          created_at: string
          created_by: string
          id: string
        }
        Insert: {
          bird_id: string
          content: string
          created_at?: string
          created_by: string
          id?: string
        }
        Update: {
          bird_id?: string
          content?: string
          created_at?: string
          created_by?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bird_notes_bird_id_fkey"
            columns: ["bird_id"]
            isOneToOne: false
            referencedRelation: "birds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bird_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bird_photos: {
        Row: {
          bird_id: string
          caption: string | null
          created_at: string
          filename: string
          id: string
          is_primary: boolean
          url: string
        }
        Insert: {
          bird_id: string
          caption?: string | null
          created_at?: string
          filename: string
          id?: string
          is_primary?: boolean
          url: string
        }
        Update: {
          bird_id?: string
          caption?: string | null
          created_at?: string
          filename?: string
          id?: string
          is_primary?: boolean
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "bird_photos_bird_id_fkey"
            columns: ["bird_id"]
            isOneToOne: false
            referencedRelation: "birds"
            referencedColumns: ["id"]
          },
        ]
      }
      birds: {
        Row: {
          breed_composition: Json | null
          breed_override: boolean
          color: string | null
          comb_type: Database["public"]["Enums"]["comb_type"] | null
          coop_id: string | null
          created_at: string
          created_by: string
          dam_id: string | null
          early_life_notes: string | null
          hatch_date: string
          id: string
          name: string | null
          sex: Database["public"]["Enums"]["bird_sex"]
          sire_id: string | null
          status: Database["public"]["Enums"]["bird_status"]
          updated_at: string
        }
        Insert: {
          breed_composition?: Json | null
          breed_override?: boolean
          color?: string | null
          comb_type?: Database["public"]["Enums"]["comb_type"] | null
          coop_id?: string | null
          created_at?: string
          created_by: string
          dam_id?: string | null
          early_life_notes?: string | null
          hatch_date: string
          id?: string
          name?: string | null
          sex: Database["public"]["Enums"]["bird_sex"]
          sire_id?: string | null
          status?: Database["public"]["Enums"]["bird_status"]
          updated_at?: string
        }
        Update: {
          breed_composition?: Json | null
          breed_override?: boolean
          color?: string | null
          comb_type?: Database["public"]["Enums"]["comb_type"] | null
          coop_id?: string | null
          created_at?: string
          created_by?: string
          dam_id?: string | null
          early_life_notes?: string | null
          hatch_date?: string
          id?: string
          name?: string | null
          sex?: Database["public"]["Enums"]["bird_sex"]
          sire_id?: string | null
          status?: Database["public"]["Enums"]["bird_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "birds_coop_id_fkey"
            columns: ["coop_id"]
            isOneToOne: false
            referencedRelation: "coops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birds_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birds_dam_id_fkey"
            columns: ["dam_id"]
            isOneToOne: false
            referencedRelation: "birds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birds_sire_id_fkey"
            columns: ["sire_id"]
            isOneToOne: false
            referencedRelation: "birds"
            referencedColumns: ["id"]
          },
        ]
      }
      breed_source_farms: {
        Row: {
          breed_id: string
          source_farm_id: string
        }
        Insert: {
          breed_id: string
          source_farm_id: string
        }
        Update: {
          breed_id?: string
          source_farm_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "breed_source_farms_breed_id_fkey"
            columns: ["breed_id"]
            isOneToOne: false
            referencedRelation: "breeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breed_source_farms_source_farm_id_fkey"
            columns: ["source_farm_id"]
            isOneToOne: false
            referencedRelation: "source_farms"
            referencedColumns: ["id"]
          },
        ]
      }
      breeds: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          varieties: Json | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          varieties?: Json | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          varieties?: Json | null
        }
        Relationships: []
      }
      coop_assignments: {
        Row: {
          assigned_at: string
          bird_id: string
          coop_id: string
          id: string
          removed_at: string | null
        }
        Insert: {
          assigned_at: string
          bird_id: string
          coop_id: string
          id?: string
          removed_at?: string | null
        }
        Update: {
          assigned_at?: string
          bird_id?: string
          coop_id?: string
          id?: string
          removed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coop_assignments_bird_id_fkey"
            columns: ["bird_id"]
            isOneToOne: false
            referencedRelation: "birds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coop_assignments_coop_id_fkey"
            columns: ["coop_id"]
            isOneToOne: false
            referencedRelation: "coops"
            referencedColumns: ["id"]
          },
        ]
      }
      coops: {
        Row: {
          capacity: number
          coop_type: Database["public"]["Enums"]["coop_type"]
          created_at: string
          id: string
          name: string
          notes: string | null
          status: Database["public"]["Enums"]["coop_status"]
          updated_at: string
        }
        Insert: {
          capacity: number
          coop_type: Database["public"]["Enums"]["coop_type"]
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          status?: Database["public"]["Enums"]["coop_status"]
          updated_at?: string
        }
        Update: {
          capacity?: number
          coop_type?: Database["public"]["Enums"]["coop_type"]
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["coop_status"]
          updated_at?: string
        }
        Relationships: []
      }
      egg_records: {
        Row: {
          bird_id: string
          created_at: string
          date: string
          egg_mark: string | null
          egg_size_category_id: string | null
          id: string
          notes: string | null
          recorded_by: string
          shell_quality: Database["public"]["Enums"]["shell_quality"] | null
          weight_grams: number | null
        }
        Insert: {
          bird_id: string
          created_at?: string
          date: string
          egg_mark?: string | null
          egg_size_category_id?: string | null
          id?: string
          notes?: string | null
          recorded_by: string
          shell_quality?: Database["public"]["Enums"]["shell_quality"] | null
          weight_grams?: number | null
        }
        Update: {
          bird_id?: string
          created_at?: string
          date?: string
          egg_mark?: string | null
          egg_size_category_id?: string | null
          id?: string
          notes?: string | null
          recorded_by?: string
          shell_quality?: Database["public"]["Enums"]["shell_quality"] | null
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "egg_records_bird_id_fkey"
            columns: ["bird_id"]
            isOneToOne: false
            referencedRelation: "birds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "egg_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      egg_size_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          max_weight_g: number | null
          min_weight_g: number | null
          name: string
          name_tl: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_weight_g?: number | null
          min_weight_g?: number | null
          name: string
          name_tl?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_weight_g?: number | null
          min_weight_g?: number | null
          name?: string
          name_tl?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      exercise_records: {
        Row: {
          bird_id: string
          created_at: string
          date: string
          duration_minutes: number | null
          exercise_type_id: string
          id: string
          intensity: string | null
          notes: string | null
        }
        Insert: {
          bird_id: string
          created_at?: string
          date: string
          duration_minutes?: number | null
          exercise_type_id: string
          id?: string
          intensity?: string | null
          notes?: string | null
        }
        Update: {
          bird_id?: string
          created_at?: string
          date?: string
          duration_minutes?: number | null
          exercise_type_id?: string
          id?: string
          intensity?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_records_bird_id_fkey"
            columns: ["bird_id"]
            isOneToOne: false
            referencedRelation: "birds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_records_exercise_type_id_fkey"
            columns: ["exercise_type_id"]
            isOneToOne: false
            referencedRelation: "exercise_types"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          name_tl: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_tl?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_tl?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      feed_consumption: {
        Row: {
          coop_id: string
          created_at: string
          date: string
          feed_inventory_id: string
          id: string
          notes: string | null
          quantity_kg: number
          recorded_by: string
        }
        Insert: {
          coop_id: string
          created_at?: string
          date: string
          feed_inventory_id: string
          id?: string
          notes?: string | null
          quantity_kg: number
          recorded_by: string
        }
        Update: {
          coop_id?: string
          created_at?: string
          date?: string
          feed_inventory_id?: string
          id?: string
          notes?: string | null
          quantity_kg?: number
          recorded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_consumption_coop_id_fkey"
            columns: ["coop_id"]
            isOneToOne: false
            referencedRelation: "coops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_consumption_feed_inventory_id_fkey"
            columns: ["feed_inventory_id"]
            isOneToOne: false
            referencedRelation: "feed_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_consumption_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_inventory: {
        Row: {
          brand: string | null
          cost_per_kg: number | null
          created_at: string
          feed_type: Database["public"]["Enums"]["feed_type"]
          id: string
          quantity_kg: number
          reorder_level: number | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          cost_per_kg?: number | null
          created_at?: string
          feed_type: Database["public"]["Enums"]["feed_type"]
          id?: string
          quantity_kg: number
          reorder_level?: number | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          cost_per_kg?: number | null
          created_at?: string
          feed_type?: Database["public"]["Enums"]["feed_type"]
          id?: string
          quantity_kg?: number
          reorder_level?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      feed_stages: {
        Row: {
          created_at: string
          description: string | null
          feed_type: Database["public"]["Enums"]["feed_type"]
          id: string
          is_active: boolean
          max_age_days: number | null
          min_age_days: number
          name: string
          name_tl: string | null
          notes: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          feed_type: Database["public"]["Enums"]["feed_type"]
          id?: string
          is_active?: boolean
          max_age_days?: number | null
          min_age_days: number
          name: string
          name_tl?: string | null
          notes?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          feed_type?: Database["public"]["Enums"]["feed_type"]
          id?: string
          is_active?: boolean
          max_age_days?: number | null
          min_age_days?: number
          name?: string
          name_tl?: string | null
          notes?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      fight_records: {
        Row: {
          bird_id: string
          created_at: string
          date: string
          id: string
          location: string | null
          notes: string | null
          outcome: Database["public"]["Enums"]["fight_outcome"]
        }
        Insert: {
          bird_id: string
          created_at?: string
          date: string
          id?: string
          location?: string | null
          notes?: string | null
          outcome: Database["public"]["Enums"]["fight_outcome"]
        }
        Update: {
          bird_id?: string
          created_at?: string
          date?: string
          id?: string
          location?: string | null
          notes?: string | null
          outcome?: Database["public"]["Enums"]["fight_outcome"]
        }
        Relationships: [
          {
            foreignKeyName: "fight_records_bird_id_fkey"
            columns: ["bird_id"]
            isOneToOne: false
            referencedRelation: "birds"
            referencedColumns: ["id"]
          },
        ]
      }
      health_incident_birds: {
        Row: {
          bird_id: string
          incident_id: string
        }
        Insert: {
          bird_id: string
          incident_id: string
        }
        Update: {
          bird_id?: string
          incident_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_incident_birds_bird_id_fkey"
            columns: ["bird_id"]
            isOneToOne: false
            referencedRelation: "birds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_incident_birds_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "health_incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      health_incidents: {
        Row: {
          created_at: string
          date_noticed: string
          diagnosis: string | null
          id: string
          notes: string | null
          outcome: Database["public"]["Enums"]["health_outcome"]
          reported_by: string
          symptoms: string | null
          treatment: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_noticed: string
          diagnosis?: string | null
          id?: string
          notes?: string | null
          outcome?: Database["public"]["Enums"]["health_outcome"]
          reported_by: string
          symptoms?: string | null
          treatment?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_noticed?: string
          diagnosis?: string | null
          id?: string
          notes?: string | null
          outcome?: Database["public"]["Enums"]["health_outcome"]
          reported_by?: string
          symptoms?: string | null
          treatment?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      id_type_config: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          name_tl: string | null
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          name_tl?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          name_tl?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      incubation_records: {
        Row: {
          actual_hatch: string | null
          chick_id: string | null
          created_at: string
          egg_record_id: string
          expected_hatch: string
          id: string
          notes: string | null
          outcome: Database["public"]["Enums"]["incubation_outcome"]
          set_date: string
          updated_at: string
        }
        Insert: {
          actual_hatch?: string | null
          chick_id?: string | null
          created_at?: string
          egg_record_id: string
          expected_hatch: string
          id?: string
          notes?: string | null
          outcome?: Database["public"]["Enums"]["incubation_outcome"]
          set_date: string
          updated_at?: string
        }
        Update: {
          actual_hatch?: string | null
          chick_id?: string | null
          created_at?: string
          egg_record_id?: string
          expected_hatch?: string
          id?: string
          notes?: string | null
          outcome?: Database["public"]["Enums"]["incubation_outcome"]
          set_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incubation_records_chick_id_fkey"
            columns: ["chick_id"]
            isOneToOne: true
            referencedRelation: "birds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incubation_records_egg_record_id_fkey"
            columns: ["egg_record_id"]
            isOneToOne: true
            referencedRelation: "egg_records"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_birds: {
        Row: {
          bird_id: string
          medication_id: string
        }
        Insert: {
          bird_id: string
          medication_id: string
        }
        Update: {
          bird_id?: string
          medication_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_birds_bird_id_fkey"
            columns: ["bird_id"]
            isOneToOne: false
            referencedRelation: "birds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_birds_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          administered_by: string
          created_at: string
          dosage: string | null
          end_date: string | null
          health_incident_id: string | null
          id: string
          medication_name: string
          notes: string | null
          start_date: string
          withdrawal_days: number | null
        }
        Insert: {
          administered_by: string
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          health_incident_id?: string | null
          id?: string
          medication_name: string
          notes?: string | null
          start_date: string
          withdrawal_days?: number | null
        }
        Update: {
          administered_by?: string
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          health_incident_id?: string | null
          id?: string
          medication_name?: string
          notes?: string | null
          start_date?: string
          withdrawal_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "medications_administered_by_fkey"
            columns: ["administered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medications_health_incident_id_fkey"
            columns: ["health_incident_id"]
            isOneToOne: false
            referencedRelation: "health_incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      offspring_count_overrides: {
        Row: {
          bird_id: string
          created_at: string
          female_count: number | null
          id: string
          male_count: number | null
          notes: string | null
          unknown_count: number | null
          updated_at: string
        }
        Insert: {
          bird_id: string
          created_at?: string
          female_count?: number | null
          id?: string
          male_count?: number | null
          notes?: string | null
          unknown_count?: number | null
          updated_at?: string
        }
        Update: {
          bird_id?: string
          created_at?: string
          female_count?: number | null
          id?: string
          male_count?: number | null
          notes?: string | null
          unknown_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offspring_count_overrides_bird_id_fkey"
            columns: ["bird_id"]
            isOneToOne: true
            referencedRelation: "birds"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          language: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          language?: string
          name: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          language?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      source_farms: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      vaccination_birds: {
        Row: {
          bird_id: string
          vaccination_id: string
        }
        Insert: {
          bird_id: string
          vaccination_id: string
        }
        Update: {
          bird_id?: string
          vaccination_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccination_birds_bird_id_fkey"
            columns: ["bird_id"]
            isOneToOne: false
            referencedRelation: "birds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccination_birds_vaccination_id_fkey"
            columns: ["vaccination_id"]
            isOneToOne: false
            referencedRelation: "vaccinations"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccinations: {
        Row: {
          administered_by: string
          created_at: string
          date_given: string
          dosage: string | null
          id: string
          method: string | null
          next_due_date: string | null
          notes: string | null
          vaccine_name: string
        }
        Insert: {
          administered_by: string
          created_at?: string
          date_given: string
          dosage?: string | null
          id?: string
          method?: string | null
          next_due_date?: string | null
          notes?: string | null
          vaccine_name: string
        }
        Update: {
          administered_by?: string
          created_at?: string
          date_given?: string
          dosage?: string | null
          id?: string
          method?: string | null
          next_due_date?: string | null
          notes?: string | null
          vaccine_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccinations_administered_by_fkey"
            columns: ["administered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_records: {
        Row: {
          bird_id: string
          created_at: string
          date: string
          id: string
          milestone: Database["public"]["Enums"]["weight_milestone"] | null
          notes: string | null
          recorded_by: string
          weight_grams: number
        }
        Insert: {
          bird_id: string
          created_at?: string
          date: string
          id?: string
          milestone?: Database["public"]["Enums"]["weight_milestone"] | null
          notes?: string | null
          recorded_by: string
          weight_grams: number
        }
        Update: {
          bird_id?: string
          created_at?: string
          date?: string
          id?: string
          milestone?: Database["public"]["Enums"]["weight_milestone"] | null
          notes?: string | null
          recorded_by?: string
          weight_grams?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_records_bird_id_fkey"
            columns: ["bird_id"]
            isOneToOne: false
            referencedRelation: "birds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      bird_sex: "MALE" | "FEMALE" | "UNKNOWN"
      bird_status:
        | "ACTIVE"
        | "SOLD"
        | "DECEASED"
        | "CULLED"
        | "LOST"
        | "BREEDING"
        | "RETIRED"
        | "ARCHIVED"
      comb_type:
        | "SINGLE"
        | "PEA"
        | "ROSE"
        | "WALNUT"
        | "BUTTERCUP"
        | "V_SHAPED"
        | "CUSHION"
      coop_status: "ACTIVE" | "MAINTENANCE" | "INACTIVE"
      coop_type:
        | "BREEDING_PEN"
        | "GROW_OUT"
        | "LAYER_HOUSE"
        | "BROODER"
        | "QUARANTINE"
      feed_type:
        | "STARTER"
        | "GROWER"
        | "LAYER"
        | "BREEDER"
        | "FINISHER"
        | "SUPPLEMENT"
      fight_outcome: "WIN" | "LOSS" | "DRAW"
      health_outcome: "RECOVERED" | "ONGOING" | "DECEASED"
      incubation_outcome:
        | "PENDING"
        | "HATCHED"
        | "INFERTILE"
        | "DEAD_IN_SHELL"
        | "BROKEN"
      shell_quality: "GOOD" | "FAIR" | "POOR" | "SOFT"
      user_role: "OWNER" | "WORKER"
      weight_milestone:
        | "HATCH"
        | "WEEK_1"
        | "WEEK_2"
        | "WEEK_4"
        | "WEEK_6"
        | "WEEK_8"
        | "WEEK_12"
        | "WEEK_16"
        | "WEEK_20"
        | "ADULT"
        | "OTHER"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
