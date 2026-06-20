export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string
          detail: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          org_id: string | null
          profile_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          detail?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          org_id?: string | null
          profile_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          detail?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          org_id?: string | null
          profile_id?: string | null
        }
        Relationships: []
      }
      charges: {
        Row: {
          amount: number
          billing_period: string | null
          charge_status: Database["public"]["Enums"]["charge_status"]
          charge_type: Database["public"]["Enums"]["charge_type"]
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string
          id: string
          lease_id: string
          org_id: string
          updated_at: string
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount: number
          billing_period?: string | null
          charge_status?: Database["public"]["Enums"]["charge_status"]
          charge_type: Database["public"]["Enums"]["charge_type"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date: string
          id?: string
          lease_id: string
          org_id?: string
          updated_at?: string
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount?: number
          billing_period?: string | null
          charge_status?: Database["public"]["Enums"]["charge_status"]
          charge_type?: Database["public"]["Enums"]["charge_type"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string
          id?: string
          lease_id?: string
          org_id?: string
          updated_at?: string
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "charges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_lease_ledger"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "charges_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_rent_roll"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "charges_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deposit_deductions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          deduction_category: Database["public"]["Enums"]["deduction_category"]
          description: string
          id: string
          lease_id: string
          org_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          deduction_category: Database["public"]["Enums"]["deduction_category"]
          description: string
          id?: string
          lease_id: string
          org_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          deduction_category?: Database["public"]["Enums"]["deduction_category"]
          description?: string
          id?: string
          lease_id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposit_deductions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_deductions_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_deductions_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_lease_ledger"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "deposit_deductions_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_rent_roll"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "deposit_deductions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          bucket: string
          created_at: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          entity_id: string
          entity_type: string
          file_name: string | null
          file_path: string
          id: string
          org_id: string
          uploaded_by: string
        }
        Insert: {
          bucket: string
          created_at?: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          entity_id: string
          entity_type: string
          file_name?: string | null
          file_path: string
          id?: string
          org_id?: string
          uploaded_by: string
        }
        Update: {
          bucket?: string
          created_at?: string
          doc_type?: Database["public"]["Enums"]["doc_type"]
          entity_id?: string
          entity_type?: string
          file_name?: string | null
          file_path?: string
          id?: string
          org_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          advance_amount: number
          advance_months: number
          created_at: string
          created_by: string | null
          deposit_refund_amount: number | null
          deposit_settled_date: string | null
          end_date: string
          escalation_frequency_months: number
          escalation_rate: number
          id: string
          lease_status: Database["public"]["Enums"]["lease_status"]
          monthly_rent: number
          org_id: string
          payment_due_day: number
          renewed_from_lease_id: string | null
          security_deposit_amount: number
          security_deposit_months: number
          start_date: string
          tenant_id: string
          termination_date: string | null
          termination_reason: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          advance_amount?: number
          advance_months?: number
          created_at?: string
          created_by?: string | null
          deposit_refund_amount?: number | null
          deposit_settled_date?: string | null
          end_date: string
          escalation_frequency_months?: number
          escalation_rate?: number
          id?: string
          lease_status?: Database["public"]["Enums"]["lease_status"]
          monthly_rent: number
          org_id?: string
          payment_due_day?: number
          renewed_from_lease_id?: string | null
          security_deposit_amount?: number
          security_deposit_months?: number
          start_date: string
          tenant_id: string
          termination_date?: string | null
          termination_reason?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          advance_amount?: number
          advance_months?: number
          created_at?: string
          created_by?: string | null
          deposit_refund_amount?: number | null
          deposit_settled_date?: string | null
          end_date?: string
          escalation_frequency_months?: number
          escalation_rate?: number
          id?: string
          lease_status?: Database["public"]["Enums"]["lease_status"]
          monthly_rent?: number
          org_id?: string
          payment_due_day?: number
          renewed_from_lease_id?: string | null
          security_deposit_amount?: number
          security_deposit_months?: number
          start_date?: string
          tenant_id?: string
          termination_date?: string | null
          termination_reason?: string | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_renewed_from_lease_id_fkey"
            columns: ["renewed_from_lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_renewed_from_lease_id_fkey"
            columns: ["renewed_from_lease_id"]
            isOneToOne: false
            referencedRelation: "v_lease_ledger"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "leases_renewed_from_lease_id_fkey"
            columns: ["renewed_from_lease_id"]
            isOneToOne: false
            referencedRelation: "v_rent_roll"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_rent_roll"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_rent_roll"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          assigned_to: string | null
          cost: number | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          lease_id: string | null
          org_id: string
          priority: Database["public"]["Enums"]["maintenance_priority"]
          reported_date: string
          resolved_date: string | null
          status: Database["public"]["Enums"]["maintenance_status"]
          title: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lease_id?: string | null
          org_id?: string
          priority?: Database["public"]["Enums"]["maintenance_priority"]
          reported_date?: string
          resolved_date?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          title: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lease_id?: string | null
          org_id?: string
          priority?: Database["public"]["Enums"]["maintenance_priority"]
          reported_date?: string
          resolved_date?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          title?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_lease_ledger"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "maintenance_requests_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_rent_roll"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "maintenance_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_rent_roll"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          dedupe_key: string
          email_sent_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          notification_type: Database["public"]["Enums"]["notification_type"]
          org_id: string
          profile_id: string
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          dedupe_key: string
          email_sent_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          notification_type: Database["public"]["Enums"]["notification_type"]
          org_id: string
          profile_id: string
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          dedupe_key?: string
          email_sent_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          notification_type?: Database["public"]["Enums"]["notification_type"]
          org_id?: string
          profile_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_settings: {
        Row: {
          lease_expiry_thresholds: number[]
          org_id: string
          reminder_email_enabled: boolean
          rent_due_window_days: number
          updated_at: string
        }
        Insert: {
          lease_expiry_thresholds?: number[]
          org_id: string
          reminder_email_enabled?: boolean
          rent_due_window_days?: number
          updated_at?: string
        }
        Update: {
          lease_expiry_thresholds?: number[]
          org_id?: string
          reminder_email_enabled?: boolean
          rent_due_window_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          owner_profile_id: string | null
          status: Database["public"]["Enums"]["org_status"]
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          owner_profile_id?: string | null
          status?: Database["public"]["Enums"]["org_status"]
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          owner_profile_id?: string | null
          status?: Database["public"]["Enums"]["org_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_owner_fk"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_allocations: {
        Row: {
          amount_applied: number
          charge_id: string
          created_at: string
          id: string
          org_id: string
          payment_id: string
        }
        Insert: {
          amount_applied: number
          charge_id: string
          created_at?: string
          id?: string
          org_id?: string
          payment_id: string
        }
        Update: {
          amount_applied?: number
          charge_id?: string
          created_at?: string
          id?: string
          org_id?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "v_charge_balances"
            referencedColumns: ["charge_id"]
          },
          {
            foreignKeyName: "payment_allocations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          lease_id: string
          notes: string | null
          org_id: string
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          proof_url: string | null
          recorded_by: string
          reference_no: string | null
          updated_at: string
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          lease_id: string
          notes?: string | null
          org_id?: string
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          proof_url?: string | null
          recorded_by: string
          reference_no?: string | null
          updated_at?: string
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          lease_id?: string
          notes?: string | null
          org_id?: string
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          proof_url?: string | null
          recorded_by?: string
          reference_no?: string | null
          updated_at?: string
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_lease_ledger"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "payments_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_rent_roll"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "payments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_dated_checks: {
        Row: {
          amount: number
          bounced_reason: string | null
          check_date: string
          check_number: string
          cleared_date: string | null
          created_at: string
          created_by: string | null
          deposited_date: string | null
          id: string
          issuing_bank: string
          lease_id: string
          linked_payment_id: string | null
          notes: string | null
          org_id: string
          status: Database["public"]["Enums"]["pdc_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          bounced_reason?: string | null
          check_date: string
          check_number: string
          cleared_date?: string | null
          created_at?: string
          created_by?: string | null
          deposited_date?: string | null
          id?: string
          issuing_bank: string
          lease_id: string
          linked_payment_id?: string | null
          notes?: string | null
          org_id?: string
          status?: Database["public"]["Enums"]["pdc_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          bounced_reason?: string | null
          check_date?: string
          check_number?: string
          cleared_date?: string | null
          created_at?: string
          created_by?: string | null
          deposited_date?: string | null
          id?: string
          issuing_bank?: string
          lease_id?: string
          linked_payment_id?: string | null
          notes?: string | null
          org_id?: string
          status?: Database["public"]["Enums"]["pdc_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_dated_checks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_dated_checks_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_dated_checks_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_lease_ledger"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "post_dated_checks_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_rent_roll"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "post_dated_checks_linked_payment_id_fkey"
            columns: ["linked_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_dated_checks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          full_name: string
          id: string
          org_id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["profile_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          full_name: string
          id: string
          org_id?: string | null
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          full_name?: string
          id?: string
          org_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_created_by_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          barangay: string | null
          city_municipality: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          org_id: string
          postal_code: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          province: string | null
          region: string | null
          status: Database["public"]["Enums"]["property_status"]
          street_address: string | null
          updated_at: string
        }
        Insert: {
          barangay?: string | null
          city_municipality?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          org_id?: string
          postal_code?: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          province?: string | null
          region?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          street_address?: string | null
          updated_at?: string
        }
        Update: {
          barangay?: string | null
          city_municipality?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          postal_code?: string | null
          property_type?: Database["public"]["Enums"]["property_type"]
          province?: string | null
          region?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          street_address?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      property_assignments: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          org_id: string
          profile_id: string
          property_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          org_id?: string
          profile_id: string
          property_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          org_id?: string
          profile_id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_assignments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_assignments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_assignments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_rent_roll"
            referencedColumns: ["property_id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          created_by: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          gov_id_number: string | null
          gov_id_type: string | null
          id: string
          notes: string | null
          org_id: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          gov_id_number?: string | null
          gov_id_type?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          gov_id_number?: string | null
          gov_id_type?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          base_monthly_rent: number
          bedrooms: number | null
          created_at: string
          created_by: string | null
          floor: string | null
          floor_area_sqm: number | null
          id: string
          notes: string | null
          org_id: string
          property_id: string
          specs: Json
          unit_label: string
          unit_status: Database["public"]["Enums"]["unit_status"]
          updated_at: string
        }
        Insert: {
          base_monthly_rent: number
          bedrooms?: number | null
          created_at?: string
          created_by?: string | null
          floor?: string | null
          floor_area_sqm?: number | null
          id?: string
          notes?: string | null
          org_id?: string
          property_id: string
          specs?: Json
          unit_label: string
          unit_status?: Database["public"]["Enums"]["unit_status"]
          updated_at?: string
        }
        Update: {
          base_monthly_rent?: number
          bedrooms?: number | null
          created_at?: string
          created_by?: string | null
          floor?: string | null
          floor_area_sqm?: number | null
          id?: string
          notes?: string | null
          org_id?: string
          property_id?: string
          specs?: Json
          unit_label?: string
          unit_status?: Database["public"]["Enums"]["unit_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_rent_roll"
            referencedColumns: ["property_id"]
          },
        ]
      }
      utility_bills: {
        Row: {
          allocation_method: Database["public"]["Enums"]["utility_allocation_method"]
          bill_date: string | null
          billing_period: string
          charges_generated_at: string | null
          created_at: string
          created_by: string | null
          due_date: string
          id: string
          org_id: string
          property_id: string
          provider: string | null
          total_amount: number
          total_consumption: number | null
          updated_at: string
          utility_type: Database["public"]["Enums"]["utility_type"]
        }
        Insert: {
          allocation_method?: Database["public"]["Enums"]["utility_allocation_method"]
          bill_date?: string | null
          billing_period: string
          charges_generated_at?: string | null
          created_at?: string
          created_by?: string | null
          due_date: string
          id?: string
          org_id?: string
          property_id: string
          provider?: string | null
          total_amount: number
          total_consumption?: number | null
          updated_at?: string
          utility_type: Database["public"]["Enums"]["utility_type"]
        }
        Update: {
          allocation_method?: Database["public"]["Enums"]["utility_allocation_method"]
          bill_date?: string | null
          billing_period?: string
          charges_generated_at?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string
          id?: string
          org_id?: string
          property_id?: string
          provider?: string | null
          total_amount?: number
          total_consumption?: number | null
          updated_at?: string
          utility_type?: Database["public"]["Enums"]["utility_type"]
        }
        Relationships: [
          {
            foreignKeyName: "utility_bills_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_bills_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_bills_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_bills_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_rent_roll"
            referencedColumns: ["property_id"]
          },
        ]
      }
      utility_meter_readings: {
        Row: {
          computed_share: number | null
          consumption: number
          created_at: string
          created_by: string | null
          current_reading: number
          generated_charge_id: string | null
          id: string
          lease_id: string
          org_id: string
          previous_reading: number
          updated_at: string
          utility_bill_id: string
        }
        Insert: {
          computed_share?: number | null
          consumption: number
          created_at?: string
          created_by?: string | null
          current_reading: number
          generated_charge_id?: string | null
          id?: string
          lease_id: string
          org_id?: string
          previous_reading: number
          updated_at?: string
          utility_bill_id: string
        }
        Update: {
          computed_share?: number | null
          consumption?: number
          created_at?: string
          created_by?: string | null
          current_reading?: number
          generated_charge_id?: string | null
          id?: string
          lease_id?: string
          org_id?: string
          previous_reading?: number
          updated_at?: string
          utility_bill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "utility_meter_readings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_meter_readings_generated_charge_id_fkey"
            columns: ["generated_charge_id"]
            isOneToOne: false
            referencedRelation: "charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_meter_readings_generated_charge_id_fkey"
            columns: ["generated_charge_id"]
            isOneToOne: false
            referencedRelation: "v_charge_balances"
            referencedColumns: ["charge_id"]
          },
          {
            foreignKeyName: "utility_meter_readings_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_meter_readings_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_lease_ledger"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "utility_meter_readings_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_rent_roll"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "utility_meter_readings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_meter_readings_utility_bill_id_fkey"
            columns: ["utility_bill_id"]
            isOneToOne: false
            referencedRelation: "utility_bills"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_charge_balances: {
        Row: {
          amount: number | null
          applied_amount: number | null
          charge_id: string | null
          charge_status: Database["public"]["Enums"]["charge_status"] | null
          charge_type: Database["public"]["Enums"]["charge_type"] | null
          due_date: string | null
          lease_id: string | null
          org_id: string | null
          outstanding: number | null
        }
        Relationships: [
          {
            foreignKeyName: "charges_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_lease_ledger"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "charges_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_rent_roll"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "charges_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_lease_ledger: {
        Row: {
          advance_held: number | null
          allocated_total: number | null
          charged_total: number | null
          deposit_held: number | null
          lease_id: string | null
          org_id: string | null
          outstanding_balance: number | null
          paid_total: number | null
          unapplied_credit: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leases_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_notifications_to_email: {
        Row: {
          body: string | null
          email_sent_at: string | null
          id: string | null
          notification_type:
            | Database["public"]["Enums"]["notification_type"]
            | null
          org_id: string | null
          profile_email: string | null
          profile_id: string | null
          reminder_email_enabled: boolean | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_rent_roll: {
        Row: {
          end_date: string | null
          lease_id: string | null
          monthly_rent: number | null
          org_id: string | null
          outstanding_balance: number | null
          property_id: string | null
          property_name: string | null
          start_date: string | null
          tenant_id: string | null
          tenant_name: string | null
          unapplied_credit: number | null
          unit_id: string | null
          unit_label: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leases_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      app_org: { Args: never; Returns: string }
      app_pm_property_ids: { Args: never; Returns: string[] }
      app_role: { Args: never; Returns: string }
      copy_charges: {
        Args: {
          p_due_date: string
          p_from_period: string
          p_lease_id: string
          p_to_period: string
        }
        Returns: number
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      do_csv_import: {
        Args: { p_entity: string; p_rows: Json }
        Returns: number
      }
      doc_property_id: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: string
      }
      finalize_lease_settlement: {
        Args: { p_lease_id: string }
        Returns: {
          deductions_total: number
          deposit_held: number
          lease_id: string
          refund_amount: number
          shortfall_charge_id: string
        }[]
      }
      generate_utility_charges: {
        Args: { p_utility_bill_id: string }
        Returns: {
          allocated_total: number
          already_generated: boolean
          bill_id: string
          charges_created: number
          total_amount: number
          variance: number
        }[]
      }
      manila_today: { Args: never; Returns: string }
      preview_utility_charges: {
        Args: { p_utility_bill_id: string }
        Returns: {
          computed_share: number
          consumption: number
          floor_area_sqm: number
          lease_id: string
        }[]
      }
      recompute_charge_status: {
        Args: { p_charge_id: string }
        Returns: undefined
      }
      responsible_for_charge: {
        Args: { p_charge_id: string }
        Returns: {
          org_id: string
          profile_id: string
        }[]
      }
      responsible_for_lease: {
        Args: { p_lease_id: string }
        Returns: {
          org_id: string
          profile_id: string
        }[]
      }
      responsible_for_pdc: {
        Args: { p_pdc_id: string }
        Returns: {
          org_id: string
          profile_id: string
        }[]
      }
      rpt_arrears_aging: {
        Args: never
        Returns: {
          bucket: string
          outstanding: number
        }[]
      }
      rpt_collection_summary: {
        Args: { p_from: string; p_property_id?: string; p_to: string }
        Returns: {
          property_id: string
          property_name: string
          total_charged: number
          total_collected: number
        }[]
      }
      rpt_dashboard: {
        Args: never
        Returns: {
          charges_due_next_7: number
          occupied_units: number
          total_outstanding: number
          vacant_units: number
        }[]
      }
      rpt_pdc_maturity: {
        Args: never
        Returns: {
          amount: number
          check_date: string
          check_number: string
          days_to_maturity: number
          issuing_bank: string
          lease_id: string
          pdc_id: string
          property_name: string
          status: Database["public"]["Enums"]["pdc_status"]
          tenant_name: string
          unit_label: string
        }[]
      }
      rpt_property_income: {
        Args: { p_from: string; p_to: string }
        Returns: {
          property_id: string
          property_name: string
          total_received: number
        }[]
      }
      run_scheduled_jobs: { Args: never; Returns: Json }
    }
    Enums: {
      charge_status: "unpaid" | "partially_paid" | "paid" | "void"
      charge_type:
        | "rent"
        | "utility_electricity"
        | "utility_water"
        | "association_dues"
        | "parking"
        | "penalty"
        | "move_out_balance"
        | "other"
      deduction_category: "unpaid_utility" | "damage"
      doc_type:
        | "lease_contract"
        | "tenant_id"
        | "payment_proof"
        | "property_photo"
        | "settlement"
        | "other"
      lease_status: "draft" | "active" | "expired" | "terminated" | "renewed"
      maintenance_priority: "low" | "medium" | "high" | "urgent"
      maintenance_status: "open" | "in_progress" | "completed" | "cancelled"
      notification_type:
        | "rent_due"
        | "rent_overdue"
        | "lease_expiring"
        | "maintenance_update"
        | "system"
        | "pdc_stale"
      org_status: "active" | "suspended"
      payment_method:
        | "cash"
        | "bank_transfer"
        | "gcash"
        | "maya"
        | "check"
        | "other"
      payment_status: "active" | "void"
      pdc_status: "vaulted" | "deposited" | "cleared" | "bounced" | "stale"
      profile_status: "active" | "inactive"
      property_status: "active" | "archived"
      property_type: "residential" | "commercial" | "mixed"
      unit_status: "vacant" | "occupied" | "under_maintenance" | "unavailable"
      user_role: "superadmin" | "admin" | "property_manager"
      utility_allocation_method: "by_submeter" | "equal_split" | "by_floor_area"
      utility_type: "electricity" | "water"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      charge_status: ["unpaid", "partially_paid", "paid", "void"],
      charge_type: [
        "rent",
        "utility_electricity",
        "utility_water",
        "association_dues",
        "parking",
        "penalty",
        "move_out_balance",
        "other",
      ],
      deduction_category: ["unpaid_utility", "damage"],
      doc_type: [
        "lease_contract",
        "tenant_id",
        "payment_proof",
        "property_photo",
        "settlement",
        "other",
      ],
      lease_status: ["draft", "active", "expired", "terminated", "renewed"],
      maintenance_priority: ["low", "medium", "high", "urgent"],
      maintenance_status: ["open", "in_progress", "completed", "cancelled"],
      notification_type: [
        "rent_due",
        "rent_overdue",
        "lease_expiring",
        "maintenance_update",
        "system",
        "pdc_stale",
      ],
      org_status: ["active", "suspended"],
      payment_method: [
        "cash",
        "bank_transfer",
        "gcash",
        "maya",
        "check",
        "other",
      ],
      payment_status: ["active", "void"],
      pdc_status: ["vaulted", "deposited", "cleared", "bounced", "stale"],
      profile_status: ["active", "inactive"],
      property_status: ["active", "archived"],
      property_type: ["residential", "commercial", "mixed"],
      unit_status: ["vacant", "occupied", "under_maintenance", "unavailable"],
      user_role: ["superadmin", "admin", "property_manager"],
      utility_allocation_method: [
        "by_submeter",
        "equal_split",
        "by_floor_area",
      ],
      utility_type: ["electricity", "water"],
    },
  },
} as const
