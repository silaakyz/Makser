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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ariza_kaydi: {
        Row: {
          aciklama: string | null
          baslangic_tarihi: string
          bitis_tarihi: string | null
          created_at: string | null
          id: string
          makine_id: string | null
          maliyet: number | null
          sure_saat: number | null
        }
        Insert: {
          aciklama?: string | null
          baslangic_tarihi: string
          bitis_tarihi?: string | null
          created_at?: string | null
          id?: string
          makine_id?: string | null
          maliyet?: number | null
          sure_saat?: number | null
        }
        Update: {
          aciklama?: string | null
          baslangic_tarihi?: string
          bitis_tarihi?: string | null
          created_at?: string | null
          id?: string
          makine_id?: string | null
          maliyet?: number | null
          sure_saat?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ariza_kaydi_makine_id_fkey"
            columns: ["makine_id"]
            isOneToOne: false
            referencedRelation: "makine"
            referencedColumns: ["id"]
          },
        ]
      }
      bakim_kaydi: {
        Row: {
          aciklama: string | null
          bakim_tarihi: string
          bakim_turu: string
          created_at: string | null
          id: string
          makine_id: string | null
          maliyet: number | null
        }
        Insert: {
          aciklama?: string | null
          bakim_tarihi: string
          bakim_turu: string
          created_at?: string | null
          id?: string
          makine_id?: string | null
          maliyet?: number | null
        }
        Update: {
          aciklama?: string | null
          bakim_tarihi?: string
          bakim_turu?: string
          created_at?: string | null
          id?: string
          makine_id?: string | null
          maliyet?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bakim_kaydi_makine_id_fkey"
            columns: ["makine_id"]
            isOneToOne: false
            referencedRelation: "makine"
            referencedColumns: ["id"]
          },
        ]
      }
      hammadde: {
        Row: {
          ad: string
          birim: string
          birim_fiyat: number
          created_at: string | null
          id: string
          kritik_stok_seviyesi: number | null
          stok_miktari: number
          tuketim_hizi: number | null
          updated_at: string | null
        }
        Insert: {
          ad: string
          birim?: string
          birim_fiyat: number
          created_at?: string | null
          id?: string
          kritik_stok_seviyesi?: number | null
          stok_miktari?: number
          tuketim_hizi?: number | null
          updated_at?: string | null
        }
        Update: {
          ad?: string
          birim?: string
          birim_fiyat?: number
          created_at?: string | null
          id?: string
          kritik_stok_seviyesi?: number | null
          stok_miktari?: number
          tuketim_hizi?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hammadde_giris: {
        Row: {
          birim_fiyat: number
          created_at: string | null
          giris_tarihi: string
          hammadde_id: string | null
          id: string
          miktar: number
          tedarikci: string | null
          toplam_tutar: number
        }
        Insert: {
          birim_fiyat: number
          created_at?: string | null
          giris_tarihi?: string
          hammadde_id?: string | null
          id?: string
          miktar: number
          tedarikci?: string | null
          toplam_tutar: number
        }
        Update: {
          birim_fiyat?: number
          created_at?: string | null
          giris_tarihi?: string
          hammadde_id?: string | null
          id?: string
          miktar?: number
          tedarikci?: string | null
          toplam_tutar?: number
        }
        Relationships: [
          {
            foreignKeyName: "hammadde_giris_hammadde_id_fkey"
            columns: ["hammadde_id"]
            isOneToOne: false
            referencedRelation: "hammadde"
            referencedColumns: ["id"]
          },
        ]
      }
      makine: {
        Row: {
          ad: string
          created_at: string | null
          durum: string
          id: string
          son_bakim_tarihi: string | null
          sonraki_bakim_tarihi: string | null
          tur: string
          updated_at: string | null
          uretim_kapasitesi: number
        }
        Insert: {
          ad: string
          created_at?: string | null
          durum?: string
          id?: string
          son_bakim_tarihi?: string | null
          sonraki_bakim_tarihi?: string | null
          tur: string
          updated_at?: string | null
          uretim_kapasitesi: number
        }
        Update: {
          ad?: string
          created_at?: string | null
          durum?: string
          id?: string
          son_bakim_tarihi?: string | null
          sonraki_bakim_tarihi?: string | null
          tur?: string
          updated_at?: string | null
          uretim_kapasitesi?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ad: string | null
          created_at: string | null
          email: string | null
          id: string
          soyad: string | null
          updated_at: string | null
        }
        Insert: {
          ad?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          soyad?: string | null
          updated_at?: string | null
        }
        Update: {
          ad?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          soyad?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      siparis: {
        Row: {
          created_at: string | null
          durum: string
          id: string
          kaynak: string
          miktar: number
          musteri: string
          siparis_maliyeti: number | null
          siparis_tarihi: string
          teslim_tarihi: string | null
          updated_at: string | null
          uretim_id: string | null
          urun_id: string | null
        }
        Insert: {
          created_at?: string | null
          durum?: string
          id?: string
          kaynak?: string
          miktar: number
          musteri: string
          siparis_maliyeti?: number | null
          siparis_tarihi?: string
          teslim_tarihi?: string | null
          updated_at?: string | null
          uretim_id?: string | null
          urun_id?: string | null
        }
        Update: {
          created_at?: string | null
          durum?: string
          id?: string
          kaynak?: string
          miktar?: number
          musteri?: string
          siparis_maliyeti?: number | null
          siparis_tarihi?: string
          teslim_tarihi?: string | null
          updated_at?: string | null
          uretim_id?: string | null
          urun_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "siparis_uretim_id_fkey"
            columns: ["uretim_id"]
            isOneToOne: false
            referencedRelation: "uretim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siparis_urun_id_fkey"
            columns: ["urun_id"]
            isOneToOne: false
            referencedRelation: "urun"
            referencedColumns: ["id"]
          },
        ]
      }
      uretim: {
        Row: {
          baslangic_zamani: string
          bitis_zamani: string | null
          calisan_personel: string | null
          created_at: string | null
          durum: string
          hedef_adet: number
          id: string
          makine_id: string | null
          updated_at: string | null
          uretilen_adet: number | null
          urun_id: string | null
        }
        Insert: {
          baslangic_zamani: string
          bitis_zamani?: string | null
          calisan_personel?: string | null
          created_at?: string | null
          durum?: string
          hedef_adet: number
          id?: string
          makine_id?: string | null
          updated_at?: string | null
          uretilen_adet?: number | null
          urun_id?: string | null
        }
        Update: {
          baslangic_zamani?: string
          bitis_zamani?: string | null
          calisan_personel?: string | null
          created_at?: string | null
          durum?: string
          hedef_adet?: number
          id?: string
          makine_id?: string | null
          updated_at?: string | null
          uretilen_adet?: number | null
          urun_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uretim_makine_id_fkey"
            columns: ["makine_id"]
            isOneToOne: false
            referencedRelation: "makine"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uretim_urun_id_fkey"
            columns: ["urun_id"]
            isOneToOne: false
            referencedRelation: "urun"
            referencedColumns: ["id"]
          },
        ]
      }
      urun: {
        Row: {
          ad: string
          agirlik: number | null
          boy: number | null
          created_at: string | null
          en: number | null
          hacim: number | null
          id: string
          kritik_stok_seviyesi: number | null
          max_basinc: number | null
          max_sicaklik: number | null
          resim_url: string | null
          satis_fiyati: number
          stok_miktari: number
          tur: string
          updated_at: string | null
          yukseklik: number | null
        }
        Insert: {
          ad: string
          agirlik?: number | null
          boy?: number | null
          created_at?: string | null
          en?: number | null
          hacim?: number | null
          id?: string
          kritik_stok_seviyesi?: number | null
          max_basinc?: number | null
          max_sicaklik?: number | null
          resim_url?: string | null
          satis_fiyati: number
          stok_miktari?: number
          tur: string
          updated_at?: string | null
          yukseklik?: number | null
        }
        Update: {
          ad?: string
          agirlik?: number | null
          boy?: number | null
          created_at?: string | null
          en?: number | null
          hacim?: number | null
          id?: string
          kritik_stok_seviyesi?: number | null
          max_basinc?: number | null
          max_sicaklik?: number | null
          resim_url?: string | null
          satis_fiyati?: number
          stok_miktari?: number
          tur?: string
          updated_at?: string | null
          yukseklik?: number | null
        }
        Relationships: []
      }
      urun_hammadde: {
        Row: {
          hammadde_id: string | null
          id: string
          miktar: number
          urun_id: string | null
        }
        Insert: {
          hammadde_id?: string | null
          id?: string
          miktar: number
          urun_id?: string | null
        }
        Update: {
          hammadde_id?: string | null
          id?: string
          miktar?: number
          urun_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "urun_hammadde_hammadde_id_fkey"
            columns: ["hammadde_id"]
            isOneToOne: false
            referencedRelation: "hammadde"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "urun_hammadde_urun_id_fkey"
            columns: ["urun_id"]
            isOneToOne: false
            referencedRelation: "urun"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "mudur" | "personel" | "operator"
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
      app_role: ["mudur", "personel", "operator"],
    },
  },
} as const
