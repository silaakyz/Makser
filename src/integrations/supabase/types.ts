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
      hammadde: {
        Row: {
          hammadde_id: number
          stok_adi: string | null
          satis_fiyati: string | null
          alis_fiyati: string | null
          kalan_miktar: string | null
          birim: string | null
          kdv_satis: number | null
          kdv_alis: number | null
          grubu: string | null
          ara_grubu: string | null
          aktif: string | null
          bilgi_kodu: number | null
          kritik_stok: string | null
          tedarikci_id: number
        }
        Insert: {
          hammadde_id: number
          stok_adi?: string | null
          satis_fiyati?: string | null
          alis_fiyati?: string | null
          kalan_miktar?: string | null
          birim?: string | null
          kdv_satis?: number | null
          kdv_alis?: number | null
          grubu?: string | null
          ara_grubu?: string | null
          aktif?: string | null
          bilgi_kodu?: number | null
          kritik_stok?: string | null
          tedarikci_id: number
        }
        Update: {
          hammadde_id?: number
          stok_adi?: string | null
          satis_fiyati?: string | null
          alis_fiyati?: string | null
          kalan_miktar?: string | null
          birim?: string | null
          kdv_satis?: number | null
          kdv_alis?: number | null
          grubu?: string | null
          ara_grubu?: string | null
          aktif?: string | null
          bilgi_kodu?: number | null
          kritik_stok?: string | null
          tedarikci_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "hammadde_tedarikci_id_fkey"
            columns: ["tedarikci_id"]
            isOneToOne: false
            referencedRelation: "tedarikciler"
            referencedColumns: ["tedarikci_id"]
          }
        ]
      }
      hammadde_hareket: {
        Row: {
          hareket_id: number
          hammadde_id: number | null
          hareket_turu: string | null
          miktar: number | null
          tarih: string | null
        }
        Insert: {
          hareket_id?: never
          hammadde_id?: number | null
          hareket_turu?: string | null
          miktar?: number | null
          tarih?: string | null
        }
        Update: {
          hareket_id?: never
          hammadde_id?: number | null
          hareket_turu?: string | null
          miktar?: number | null
          tarih?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hammadde_hareket_hammadde_id_fkey"
            columns: ["hammadde_id"]
            isOneToOne: false
            referencedRelation: "hammadde"
            referencedColumns: ["hammadde_id"]
          }
        ]
      }
      makine: {
        Row: {
          makine_id: number
          ad: string | null
          tur: string | null
          kapasite: string | null
          toplam_calisma_saati: number | null
        }
        Insert: {
          makine_id: number
          ad?: string | null
          tur?: string | null
          kapasite?: string | null
          toplam_calisma_saati?: number | null
        }
        Update: {
          makine_id?: number
          ad?: string | null
          tur?: string | null
          kapasite?: string | null
          toplam_calisma_saati?: number | null
        }
        Relationships: []
      }
      makine_ariza: {
        Row: {
          ariza_id: number
          makine_id: number
          personel_id: number
          maliyet: number | null
          ariza_turu: string | null
        }
        Insert: {
          ariza_id: number
          makine_id: number
          personel_id: number
          maliyet?: number | null
          ariza_turu?: string | null
        }
        Update: {
          ariza_id?: number
          makine_id?: number
          personel_id?: number
          maliyet?: number | null
          ariza_turu?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "makine_ariza_makine_id_fkey"
            columns: ["makine_id"]
            isOneToOne: false
            referencedRelation: "makine"
            referencedColumns: ["makine_id"]
          },
          {
            foreignKeyName: "makine_ariza_personel_id_fkey"
            columns: ["personel_id"]
            isOneToOne: false
            referencedRelation: "personel"
            referencedColumns: ["personel_id"]
          }
        ]
      }
      makine_bakim: {
        Row: {
          bakim_id: number
          makine_id: number
          bakim_tarihi: string | null
          bakim_turu: string | null
          maliyet: number | null
          sonraki_bakim_tarihi: string | null
        }
        Insert: {
          bakim_id: number
          makine_id: number
          bakim_tarihi?: string | null
          bakim_turu?: string | null
          maliyet?: number | null
          sonraki_bakim_tarihi?: string | null
        }
        Update: {
          bakim_id?: number
          makine_id?: number
          bakim_tarihi?: string | null
          bakim_turu?: string | null
          maliyet?: number | null
          sonraki_bakim_tarihi?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "makine_bakim_makine_id_fkey"
            columns: ["makine_id"]
            isOneToOne: false
            referencedRelation: "makine"
            referencedColumns: ["makine_id"]
          }
        ]
      }
      musteriler: {
        Row: {
          musteri_id: number
          isim: string | null
          soyisim: string | null
          cari_kodu: string | null
          telefon: string | null
          il: string | null
          ilce: string | null
          adres: string | null
          aktif: string | null
        }
        Insert: {
          musteri_id: number
          isim?: string | null
          soyisim?: string | null
          cari_kodu?: string | null
          telefon?: string | null
          il?: string | null
          ilce?: string | null
          adres?: string | null
          aktif?: string | null
        }
        Update: {
          musteri_id?: number
          isim?: string | null
          soyisim?: string | null
          cari_kodu?: string | null
          telefon?: string | null
          il?: string | null
          ilce?: string | null
          adres?: string | null
          aktif?: string | null
        }
        Relationships: []
      }
      personel: {
        Row: {
          personel_id: number
          ad: string | null
          soyad: string | null
          unvan: string | null
          mail: string | null
          sifre: string | null
        }
        Insert: {
          personel_id?: number
          ad?: string | null
          soyad?: string | null
          unvan?: string | null
          mail?: string | null
          sifre?: string | null
        }
        Update: {
          personel_id?: number
          ad?: string | null
          soyad?: string | null
          unvan?: string | null
          mail?: string | null
          sifre?: string | null
        }
        Relationships: []
      }
      siparis: {
        Row: {
          siparis_id: number
          musteri_id: number | null
          siparis_tarihi: string | null
          teslim_tarihi: string | null
          durum: string | null
          urun_id: number
        }
        Insert: {
          siparis_id: number
          musteri_id?: number | null
          siparis_tarihi?: string | null
          teslim_tarihi?: string | null
          durum?: string | null
          urun_id: number
        }
        Update: {
          siparis_id?: number
          musteri_id?: number | null
          siparis_tarihi?: string | null
          teslim_tarihi?: string | null
          durum?: string | null
          urun_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "siparis_musteri_id_fkey"
            columns: ["musteri_id"]
            isOneToOne: false
            referencedRelation: "musteriler"
            referencedColumns: ["musteri_id"]
          },
          {
            foreignKeyName: "siparis_urun_id_fkey"
            columns: ["urun_id"]
            isOneToOne: false
            referencedRelation: "urun"
            referencedColumns: ["urun_id"]
          }
        ]
      }
      siparis_maliyet: {
        Row: {
          siparis_maliyet_id: number
          siparis_id: number
          hammadde_maliyeti: string | null
          iscilik_maliyeti: number | null
          toplam_maliyet: string | null
          satis_fiyati: string | null
          kar_zarar: string | null
        }
        Insert: {
          siparis_maliyet_id: number
          siparis_id: number
          hammadde_maliyeti?: string | null
          iscilik_maliyeti?: number | null
          toplam_maliyet?: string | null
          satis_fiyati?: string | null
          kar_zarar?: string | null
        }
        Update: {
          siparis_maliyet_id?: number
          siparis_id?: number
          hammadde_maliyeti?: string | null
          iscilik_maliyeti?: number | null
          toplam_maliyet?: string | null
          satis_fiyati?: string | null
          kar_zarar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "siparis_maliyet_siparis_id_fkey"
            columns: ["siparis_id"]
            isOneToOne: true
            referencedRelation: "siparis"
            referencedColumns: ["siparis_id"]
          }
        ]
      }
      tedarikciler: {
        Row: {
          tedarikci_id: number
          firma: string | null
          ad: string | null
          soyad: string | null
          cari_kodu: string | null
          telefon: string | null
          il: string | null
          ilce: string | null
          adres: string | null
          grubu: string | null
          aktif: string | null
        }
        Insert: {
          tedarikci_id: number
          firma?: string | null
          ad?: string | null
          soyad?: string | null
          cari_kodu?: string | null
          telefon?: string | null
          il?: string | null
          ilce?: string | null
          adres?: string | null
          grubu?: string | null
          aktif?: string | null
        }
        Update: {
          tedarikci_id?: number
          firma?: string | null
          ad?: string | null
          soyad?: string | null
          cari_kodu?: string | null
          telefon?: string | null
          il?: string | null
          ilce?: string | null
          adres?: string | null
          grubu?: string | null
          aktif?: string | null
        }
        Relationships: []
      }
      uretim_kayit: {
        Row: {
          uretim_id: number
          urun_id: number
          makine_id: number
          baslama_zamani: string | null
          bitis_zamani: string | null
        }
        Insert: {
          uretim_id: number
          urun_id: number
          makine_id?: never
          baslama_zamani?: string | null
          bitis_zamani?: string | null
        }
        Update: {
          uretim_id?: number
          urun_id?: number
          makine_id?: never
          baslama_zamani?: string | null
          bitis_zamani?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uretim_kayit_makine_id_fkey"
            columns: ["makine_id"]
            isOneToOne: false
            referencedRelation: "makine"
            referencedColumns: ["makine_id"]
          },
          {
            foreignKeyName: "uretim_kayit_urun_id_fkey"
            columns: ["urun_id"]
            isOneToOne: false
            referencedRelation: "urun"
            referencedColumns: ["urun_id"]
          }
        ]
      }
      urun: {
        Row: {
          urun_id: number
          ad: string | null
          tur: string | null
          satis_fiyati: number | null
        }
        Insert: {
          urun_id?: never
          ad?: string | null
          tur?: string | null
          satis_fiyati?: number | null
        }
        Update: {
          urun_id?: never
          ad?: string | null
          tur?: string | null
          satis_fiyati?: number | null
        }
        Relationships: []
      }
      urun_recetesi: {
        Row: {
          recete_id: number
          urun_id: number
          hammadde_id: number
          miktar: number | null
        }
        Insert: {
          recete_id?: never
          urun_id: number
          hammadde_id: number
          miktar?: number | null
        }
        Update: {
          recete_id?: never
          urun_id?: number
          hammadde_id?: number
          miktar?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "urun_recetesi_hammadde_id_fkey"
            columns: ["hammadde_id"]
            isOneToOne: false
            referencedRelation: "hammadde"
            referencedColumns: ["hammadde_id"]
          },
          {
            foreignKeyName: "urun_recetesi_urun_id_fkey"
            columns: ["urun_id"]
            isOneToOne: false
            referencedRelation: "urun"
            referencedColumns: ["urun_id"]
          }
        ]
      }
      urun_stok: {
        Row: {
          urun_stok_id: number
          urun_id: number | null
          miktar: number | null
          son_guncelleme: string | null
        }
        Insert: {
          urun_stok_id: number
          urun_id?: number | null
          miktar?: number | null
          son_guncelleme?: string | null
        }
        Update: {
          urun_stok_id?: number
          urun_id?: number | null
          miktar?: number | null
          son_guncelleme?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "urun_stok_urun_id_fkey"
            columns: ["urun_id"]
            isOneToOne: false
            referencedRelation: "urun"
            referencedColumns: ["urun_id"]
          }
        ]
      }
      user_roles: {
        Row: {
          id: number
          user_id: string | null
          role: string
          created_at: string | null
        }
        Insert: {
          id?: never
          user_id?: string | null
          role: string
          created_at?: string | null
        }
        Update: {
          id?: never
          user_id?: string | null
          role?: string
          created_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role:
      | "sirket_sahibi"
      | "genel_mudur"
      | "muhasebe"
      | "uretim_sefi"
      | "teknisyen"
      | "servis_personeli"
      | "saha_montaj"
      | "uretim_personeli"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helpers
type DatabaseWithoutInternals = Omit<Database, "Public">

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])
  : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
    Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
    Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
  | keyof Database["public"]["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
  | keyof Database["public"]["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
  | keyof Database["public"]["Enums"]
  | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
  : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
