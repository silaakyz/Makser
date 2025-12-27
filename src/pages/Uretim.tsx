import { CreateProductionDialog } from "@/components/production/CreateProductionDialog";

// ... existing imports

interface UretimRow {
  // ... existing interface
}

// ... existing interfaces

export default function Uretim() {
  // ... existing state

  // ... existing code

  const fetchProductionData = useCallback(async () => {
    try {
      setLoading(true);
      // Removed date filter to show all data
      // const today = new Date();
      // const start = new Date();
      // start.setDate(today.getDate() - 6);

      // Using correct table 'uretim_kayit' and columns
      // Note: 'durum' is derived from bitis_zamani
      const [{ data: uData, error: uError }, { data: mData, error: mError }] =
        await Promise.all([
          supabase
            .from("uretim_kayit")
            .select(
              `uretim_id, baslama_zamani, bitis_zamani, makine_id, urun_id,
               urun(ad),
               makine(ad)`
            )
            .order('baslama_zamani', { ascending: false }), // Order by newest first
          // .gte("baslama_zamani", start.toISOString()), // Removed filter
          supabase.from("makine").select("makine_id, ad, kapasite"),
        ]);

      // ... existing code

      return (
        <DashboardLayout>
          <div className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Üretim Yönetimi</h1>
                <p className="text-white/70">Anlık üretim durumu ve performans metrikleri</p>
              </div>
              <CreateProductionDialog onProductionCreated={fetchProductionData} />
            </div>

            {/* ... rest of the component */}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="OEE Skoru"
                value={`${oeeSkoru}%`}
                icon={Target}
                variant="info"
                subtitle="Overall Equipment Effectiveness"
              />
              <KpiCard
                title="Üretim Verimliliği"
                value={`${uretimVerimlilik}%`}
                icon={TrendingUp}
                variant="success"
                subtitle="Hedef: 85%"
              />
              <KpiCard
                title="Aktif Üretim"
                value={aktifUretimler.length}
                icon={Factory}
                variant="default"
                subtitle={`${uretimler.length} toplam üretim`}
              />
              <KpiCard
                title="Ortalama Süre"
                value={`${ortalamaSure.toFixed(1)} saat`}
                icon={Clock}
                variant="warning"
                subtitle="Üretim başına"
              />
            </div>

            {/* Aktif Üretimler */}
            <Card className="bg-card border-border hover:border-primary/30 transition-all">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-card-foreground">Aktif Üretimler</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Makine Adı</TableHead>
                      <TableHead>Ürün Adı</TableHead>
                      <TableHead>Başlangıç</TableHead>
                      <TableHead>İlerleme</TableHead>
                      <TableHead>Üretilen</TableHead>
                      <TableHead>Personel</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                          Üretim verileri yükleniyor...
                        </TableCell>
                      </TableRow>
                    )}
                    {!loading && aktifUretimler.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                          Aktif üretim bulunmamaktadır
                        </TableCell>
                      </TableRow>
                    )}
                    {!loading &&
                      aktifUretimler.map((uretim) => {
                        const oran =
                          uretim.hedef_adet > 0
                            ? Math.round((uretim.uretilen_adet / uretim.hedef_adet) * 100)
                            : 0;
                        return (
                          <TableRow key={uretim.id}>
                            <TableCell className="font-medium">
                              {uretim.makine?.ad || "Bilinmiyor"}
                            </TableCell>
                            <TableCell>{uretim.urun?.ad || "Bilinmiyor"}</TableCell>
                            <TableCell>{uretim.baslangic_zamani}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${oran}%` }}
                                  />
                                </div>
                                <span className="text-sm text-muted-foreground">{oran}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {uretim.uretilen_adet} / {uretim.hedef_adet}
                            </TableCell>
                            <TableCell>-</TableCell>
                            <TableCell>
                              <StatusBadge status={uretim.durum} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Grafikler */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border hover:border-primary/30 transition-all">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-card-foreground">
                    Haftalık Üretim Trendi
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  {weeklyTrend.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                      Üretim verisi bulunamadı
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="tarih" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="adet" name="Üretilen Adet" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-border hover:border-primary/30 transition-all">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-card-foreground">
                    Makine Kapasite Kullanımı (Son 7 Gün)
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  {machineUsage.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                      Makine verisi bulunamadı
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={machineUsage}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="makine" stroke="#9ca3af" />
                        <YAxis unit="%" stroke="#9ca3af" />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="kullanim"
                          name="Kapasite Kullanımı"
                          stroke="#22c55e"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* OEE Bileşenleri */}
            <Card className="bg-card border-border hover:border-primary/30 transition-all">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-card-foreground">OEE Bileşenleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Kullanılabilirlik</span>
                      <span className="text-lg font-bold text-foreground">85%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-success" style={{ width: "85%" }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Performans</span>
                      <span className="text-lg font-bold text-foreground">78%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-warning" style={{ width: "78%" }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Kalite</span>
                      <span className="text-lg font-bold text-foreground">92%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: "92%" }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Kazan Ürünleri ve Teknik Dokümanlar */}
            <Card className="bg-card border-border hover:border-primary/30 transition-all">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-card-foreground">
                  Kazan Ürünleri - Teknik Özellikler
                </CardTitle>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    Ürün verileri yükleniyor...
                  </div>
                ) : urunler.length === 0 ? (
                  <div className="text-center text-muted-foreground py-10">
                    Henüz kayıtlı kazan ürünü bulunmamaktadır.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {urunler.map((urun) => (
                      <div
                        key={urun.id}
                        className="border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all flex flex-col"
                      >
                        {urun.resim_url && (
                          <div className="relative h-48 bg-muted">
                            <img
                              src={urun.resim_url}
                              alt={urun.ad}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4 space-y-3 flex-1">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">{urun.ad}</h3>
                            <p className="text-sm text-muted-foreground">{urun.tur}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {urun.en !== null && (
                              <div>
                                <span className="text-muted-foreground">En:</span>
                                <span className="ml-1 text-foreground font-medium">{urun.en} cm</span>
                              </div>
                            )}
                            {urun.boy !== null && (
                              <div>
                                <span className="text-muted-foreground">Boy:</span>
                                <span className="ml-1 text-foreground font-medium">{urun.boy} cm</span>
                              </div>
                            )}
                            {urun.yukseklik !== null && (
                              <div>
                                <span className="text-muted-foreground">Yükseklik:</span>
                                <span className="ml-1 text-foreground font-medium">{urun.yukseklik} cm</span>
                              </div>
                            )}
                            {urun.hacim !== null && (
                              <div>
                                <span className="text-muted-foreground">Hacim:</span>
                                <span className="ml-1 text-foreground font-medium">{urun.hacim} L</span>
                              </div>
                            )}
                            {urun.agirlik !== null && (
                              <div>
                                <span className="text-muted-foreground">Ağırlık:</span>
                                <span className="ml-1 text-foreground font-medium">{urun.agirlik} kg</span>
                              </div>
                            )}
                            {urun.max_basinc !== null && (
                              <div>
                                <span className="text-muted-foreground">Max Basınç:</span>
                                <span className="ml-1 text-foreground font-medium">{urun.max_basinc} bar</span>
                              </div>
                            )}
                            {urun.max_sicaklik !== null && (
                              <div>
                                <span className="text-muted-foreground">Max Sıcaklık:</span>
                                <span className="ml-1 text-foreground font-medium">{urun.max_sicaklik}°C</span>
                              </div>
                            )}
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Stok:</span>
                              <span className="ml-1 text-foreground font-medium">
                                {urun.stok_miktari.toLocaleString("tr-TR")} adet
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Satış Fiyatı:</span>
                              <span className="ml-1 text-primary font-semibold">
                                ₺{urun.satis_fiyati.toLocaleString("tr-TR")}
                              </span>
                            </div>
                            <div className="col-span-2 flex items-center justify-between pt-2 border-t border-border">
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <FileDown className="w-4 h-4" />
                                {urun.teknik_dokuman_url ? (
                                  <a
                                    href={urun.teknik_dokuman_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary underline"
                                  >
                                    Teknik dokümanı indir
                                  </a>
                                ) : (
                                  <span>Teknik doküman yüklenmemiş</span>
                                )}
                              </div>
                              {isManager && (
                                <Button
                                  size="sm"
                                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                                  onClick={() => openDocDialog(urun)}
                                >
                                  {urun.teknik_dokuman_url ? "Belgeyi Güncelle" : "Belge Yükle"}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Dialog open={docDialogOpen} onOpenChange={setDocDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Teknik Doküman Yükle</DialogTitle>
                <DialogDescription>
                  {selectedProduct
                    ? `${selectedProduct.ad} ürünü için teknik belge yükleyin.`
                    : "Bir ürün seçin."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">
                  PDF veya ofis dokümanı yükleyebilirsiniz. Dosya ismi otomatik olarak düzenlenir.
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDocDialogOpen(false)}
                  disabled={uploadingDoc}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 border-none"
                >
                  İptal
                </Button>
                <Button
                  onClick={handleDocumentUpload}
                  disabled={uploadingDoc}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {uploadingDoc ? "Yükleniyor..." : "Kaydet"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DashboardLayout>
      );
    }
