"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe, Clock, Shield, LifeBuoy, Bell, Save, Moon, Sun, Monitor, Truck, Building2, MapPin } from "lucide-react"
import { useSettingsStore } from "@/store/settings.store"
import { toast } from "sonner"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { transport, company, setTransportSettings, setCompanySettings } = useSettingsStore()
  const [pricePerKm, setPricePerKm] = useState(String(transport.pricePerKm))
  const [freeKmThreshold, setFreeKmThreshold] = useState(String(transport.freeKmThreshold))
  const [companyAddress, setCompanyAddress] = useState(company.address)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ustawienia</h1>
        <p className="text-muted-foreground">
          Zarządzaj ustawieniami aplikacji, strefą czasową i preferencjami.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Ogólne
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Firma
          </TabsTrigger>
          <TabsTrigger value="transport" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Transport
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Powiadomienia
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Prywatność
          </TabsTrigger>
          <TabsTrigger value="help" className="flex items-center gap-2">
            <LifeBuoy className="h-4 w-4" />
            Pomoc
          </TabsTrigger>
        </TabsList>

        {/* OGÓLNE USTAWIENIA */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Globalne preferencje</CardTitle>
              <CardDescription>
                Skonfiguruj podstawowe ustawienia swojej aplikacji.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Motyw</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Wybierz motyw" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" /> Jasny
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" /> Ciemny
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" /> Systemowy
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Język aplikacji</Label>
                  <Select defaultValue="pl">
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Wybierz język" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pl">Polski</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    Strefa czasowa
                  </Label>
                  <Select defaultValue="europe-warsaw">
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Wybierz strefę czasową" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="europe-warsaw">Central European Time (Warsaw)</SelectItem>
                      <SelectItem value="europe-london">Central European Time (London)</SelectItem>
                      <SelectItem value="america-new_york">Eastern Standard Time (New York)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end border-t pt-6">
                <Button>
                  <Save className="w-4 h-4 mr-2" />
                  Zapisz zmiany
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FIRMA */}
        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dane firmy</CardTitle>
              <CardDescription>
                Adres siedziby firmy — punkt startowy do obliczania dystansu dojazdów.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Adres firmy
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Pełny adres z kodem pocztowym i miastem, np. ul. Przykładowa 10, 00-000 Warszawa.
                  </p>
                  <Input
                    className="w-full max-w-md"
                    placeholder="ul. Przykładowa 10, 00-000 Warszawa"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end border-t pt-6">
                <Button
                  onClick={() => {
                    const trimmed = companyAddress.trim()
                    if (!trimmed) {
                      toast.error('Podaj adres firmy')
                      return
                    }
                    setCompanySettings({ address: trimmed })
                    toast.success('Adres firmy został zapisany')
                  }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Zapisz adres firmy
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TRANSPORT */}
        <TabsContent value="transport" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Koszty transportu</CardTitle>
              <CardDescription>
                Skonfiguruj stawkę za kilometr oraz próg darmowego transportu.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Próg darmowego transportu (km)</Label>
                  <p className="text-sm text-muted-foreground">
                    Poniżej tej wartości transport jest bezpłatny.
                  </p>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    className="w-[300px]"
                    value={freeKmThreshold}
                    onChange={(e) => setFreeKmThreshold(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Cena za kilometr (PLN)</Label>
                  <p className="text-sm text-muted-foreground">
                    Stawka naliczana za każdy kilometr powyżej progu darmowego transportu.
                  </p>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    className="w-[300px]"
                    value={pricePerKm}
                    onChange={(e) => setPricePerKm(e.target.value)}
                  />
                </div>

                <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Przykład kalkulacji</p>
                  <p>
                    Dla dystansu <strong>50 km</strong> przy progu <strong>{freeKmThreshold || 0} km</strong> i stawce <strong>{pricePerKm || 0} zł/km</strong>:
                  </p>
                  <p className="mt-1 font-mono">
                    {(() => {
                      const threshold = parseFloat(freeKmThreshold) || 0
                      const price = parseFloat(pricePerKm) || 0
                      const exampleKm = 50
                      const billable = Math.max(0, exampleKm - threshold)
                      const cost = billable * price
                      return `(${exampleKm} - ${threshold}) × ${price} zł = ${cost.toFixed(2)} zł`
                    })()}
                  </p>
                </div>
              </div>

              <div className="flex justify-end border-t pt-6">
                <Button
                  onClick={() => {
                    const parsedPrice = parseFloat(pricePerKm)
                    const parsedThreshold = parseFloat(freeKmThreshold)
                    if (isNaN(parsedPrice) || parsedPrice < 0) {
                      toast.error('Podaj prawidłową cenę za kilometr')
                      return
                    }
                    if (isNaN(parsedThreshold) || parsedThreshold < 0) {
                      toast.error('Podaj prawidłowy próg kilometrów')
                      return
                    }
                    setTransportSettings({
                      pricePerKm: parsedPrice,
                      freeKmThreshold: parsedThreshold,
                    })
                    toast.success('Ustawienia transportu zostały zapisane')
                  }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Zapisz ustawienia transportu
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* POWIADOMIENIA */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Powiadomienia</CardTitle>
              <CardDescription>
                Zdecyduj, o czym i jak chcesz być informowany.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Nowe rezerwacje</Label>
                    <p className="text-sm text-muted-foreground">
                      Otrzymuj powiadomienia, gdy klient utworzy nową rezerwację.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Raporty dzienne</Label>
                    <p className="text-sm text-muted-foreground">
                      Otrzymuj codzienne podsumowanie statystyk na e-mail.
                    </p>
                  </div>
                  <Switch />
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRYWATNOŚĆ I BEZPIECZEŃSTWO */}
        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Polityka prywatności i dane</CardTitle>
              <CardDescription>
                Zarządzaj swoimi danymi i prywatnością na koncie.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium text-foreground">Informacja o przetwarzaniu danych</h3>
                <p>
                  Korzystając z aplikacji Kraina Zjeżdżalni, zgadzasz się na przetwarzanie danych osobowych związanych z Twoją działalnością w systemie (np. dane klientów, historia wypożyczeń). Wszystkie dane są odpowiednio zabezpieczone w naszej bazie danych i nie są przekazywane podmiotom trzecim.
                </p>
                <div className="pt-2">
                  <Button variant="outline" size="sm">
                    Pobierz kopię swoich danych (JSON)
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-destructive/20 p-4">
                <div className="space-y-0.5">
                  <Label className="text-base text-destructive">Usuń konto</Label>
                  <p className="text-sm text-muted-foreground">
                    Trwałe usunięcie konta i wszystkich powiązanych danych. Operacja jest nieodwracalna.
                  </p>
                </div>
                <Button variant="destructive">Usuń konto</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* POMOC */}
        <TabsContent value="help" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pomoc i wsparcie</CardTitle>
              <CardDescription>
                Skontaktuj się z obsługą lub znajdź odpowiedzi na swoje pytania.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4 space-y-2">
                  <LifeBuoy className="w-8 h-8 text-primary" />
                  <h3 className="font-medium">Centrum pomocy</h3>
                  <p className="text-sm text-muted-foreground">
                    Przejrzyj nasze poradniki, aby dowiedzieć się, jak zarządzać rezerwacjami i statystykami.
                  </p>
                  <Button variant="link" className="mt-2 text-sm w-full">Przejdź do poradników</Button>
                </div>
                <div className="rounded-lg border p-4 space-y-2">
                  <Globe className="w-8 h-8 text-primary" />
                  <h3 className="font-medium">Wsparcie techniczne</h3>
                  <p className="text-sm text-muted-foreground">
                    Napisz bezpośrednio do naszego zespołu. Pomożemy w rozwiązaniu każdego problemu.
                  </p>
                  <Button variant="link" className="mt-2 text-sm w-full">Skontaktuj się z nami</Button>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t text-sm text-muted-foreground text-center">
                Wersja aplikacji: <span className="font-mono">v0.1.0-beta</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
