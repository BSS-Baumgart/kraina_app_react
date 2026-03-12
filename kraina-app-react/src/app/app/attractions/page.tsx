'use client'

import { useState } from 'react'
import { useAttractions, useToggleAttractionStatus, useDeleteAttraction } from '@/hooks/useAttractions'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Ruler, Weight, Image as ImageIcon, Map, Layers, Power, PowerOff, Edit, Trash2, X } from 'lucide-react'
import { Attraction } from '@/lib/types'
import { AttractionForm } from '@/components/attractions/AttractionForm'

export default function AttractionsPage() {
  const { attractions, isLoading, error } = useAttractions()
  const toggleMutation = useToggleAttractionStatus()
  const deleteMutation = useDeleteAttraction()
  const { user } = useAuth()

  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [attractionToEdit, setAttractionToEdit] = useState<Attraction | null>(null)

  const canManageAttractions = user?.role === 'admin' || user?.role === 'owner'
  
  if (error) {
    return <div className="p-4 text-destructive">Wystąpił błąd podczas ładowania atrakcji.</div>
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {canManageAttractions && (
          <Button 
            className="w-full sm:w-auto shadow-sm"
            onClick={() => {
              setAttractionToEdit(null)
              setIsFormOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Dodaj atrakcję
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-border flex flex-col">
              <Skeleton className="h-48 w-full rounded-none" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3 mt-1" />
              </CardHeader>
              <CardContent className="flex-grow">
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : attractions.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center text-muted-foreground shadow-sm">
          Brak aktywnych atrakcji w bazie.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {attractions.map((attraction) => (
            <Card key={attraction.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow border-border">
              <div className="relative h-48 w-full bg-muted flex items-center justify-center">
                {attraction.primaryImageUrl ? (
                  <img
                    src={attraction.primaryImageUrl}
                    alt={attraction.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground text-sm">Brak zdjęcia</span>
                )}
                
                {!attraction.isActive && (
                  <div className="absolute top-2 right-2 z-10">
                    <Badge variant="destructive" className="shadow-sm">Nieaktywna</Badge>
                  </div>
                )}
                
                {attraction.category && (
                  <div className="absolute top-2 left-2 z-10">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-md shadow-sm">
                      {attraction.category}
                    </Badge>
                  </div>
                )}
              </div>
              
              <CardHeader className="pb-2 flex-grow-0">
                <CardTitle className="text-xl line-clamp-1 text-foreground" title={attraction.name}>
                  {attraction.name}
                </CardTitle>
                <CardDescription className="line-clamp-2 min-h-[40px]" title={attraction.description}>
                  {attraction.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-grow pb-4">
                <div className="space-y-2 text-sm text-foreground/80">
                  <div className="flex items-center">
                    <Ruler className="mr-2 h-4 w-4 text-primary" />
                    <span className="ml-2">{attraction.dimensions}</span>
                  </div>
                  <div className="flex items-center">
                    <Weight className="mr-2 h-4 w-4 text-primary" />
                    <span className="ml-2">{attraction.weight} kg</span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-0 flex flex-col gap-3 items-stretch">
                <div className="flex justify-between items-center border-t border-border pt-4">
                  <span className="text-sm font-medium text-muted-foreground">Cena / dzień</span>
                  <span className="text-xl font-bold tracking-tight text-primary">
                    {attraction.formattedPrice}
                  </span>
                </div>
                
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => {
                    setSelectedAttraction(attraction)
                    setSelectedImageIndex(0)
                  }}
                >
                  Zobacz szczegóły
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedAttraction} onOpenChange={(open) => {
        if (!open) {
          setSelectedAttraction(null)
          setSelectedImageIndex(0)
        }
      }}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto p-0 gap-0">
          {selectedAttraction && (
            <>
              <div className="p-6 pb-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-2xl font-bold">{selectedAttraction.name}</DialogTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-border bg-background" onClick={() => {
                    setSelectedAttraction(null)
                    setSelectedImageIndex(0)
                  }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2 flex-wrap mt-2">
                  {selectedAttraction.category && (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground font-normal">
                      <Layers className="w-3 h-3 mr-1" />
                      {selectedAttraction.category}
                    </Badge>
                  )}
                  {selectedAttraction.isActive ? (
                    <Badge variant="outline" className="border-green-500/30 text-green-500 bg-green-500/10 font-normal">Aktywna</Badge>
                  ) : (
                    <Badge variant="destructive" className="font-normal">Nieaktywna</Badge>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-10">
                <div className="space-y-4">
                  <div className="w-full h-[300px] sm:h-[400px] rounded-xl overflow-hidden bg-muted flex items-center justify-center relative">
                    {selectedAttraction.imageUrls && selectedAttraction.imageUrls.length > 0 ? (
                      <img
                        src={selectedAttraction.imageUrls[selectedImageIndex] || selectedAttraction.primaryImageUrl}
                        alt={selectedAttraction.name}
                        className="w-full h-full object-contain transition-all duration-300"
                      />
                    ) : selectedAttraction.primaryImageUrl ? (
                      <img
                        src={selectedAttraction.primaryImageUrl}
                        alt={selectedAttraction.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground">
                        <ImageIcon className="w-10 h-10 mb-2 opacity-20" />
                        <span>Brak zdjęcia głównego</span>
                      </div>
                    )}
                  </div>

                  {selectedAttraction.imageUrls && selectedAttraction.imageUrls.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {selectedAttraction.imageUrls.map((url: string, idx: number) => (
                        <button 
                          key={idx} 
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden bg-muted border-2 transition-all ${
                            idx === selectedImageIndex ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-70 hover:opacity-100 hover:border-border'
                          }`}
                        >
                          <img src={url} alt={`Zdjęcie ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-foreground tracking-tight">Opis</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {selectedAttraction.description || "Brak opisu dla tej atrakcji."}
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-foreground tracking-tight">Specyfikacja</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Card className="shadow-none relative overflow-hidden bg-card">
                      <CardContent className="p-4 flex flex-col gap-1">
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Map className="w-4 h-4 mr-2" /> Wymiary (S x D x W)
                        </div>
                        <div className="text-base font-semibold text-foreground mt-1">
                          {selectedAttraction.dimensions}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-none border-border relative overflow-hidden bg-card">
                      <CardContent className="p-4 flex flex-col gap-1">
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Weight className="w-4 h-4 mr-2" /> Waga
                        </div>
                        <div className="text-base font-semibold text-foreground mt-1">
                          {selectedAttraction.weight} kg
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-foreground tracking-tight">Finanse</h3>
                  <Card className="shadow-none bg-card border-border overflow-hidden">
                    <CardContent className="p-5 flex justify-between items-center">
                      <span className="font-semibold text-foreground">Cena wynajmu (1 dzień)</span>
                      <span className="text-2xl font-bold text-primary">{selectedAttraction.formattedPrice}</span>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {canManageAttractions && (
                <div className="p-6 border-t border-border mt-auto flex flex-col sm:flex-row sm:justify-between items-center gap-3 w-full bg-background/95 backdrop-blur sticky bottom-0">
                  <div className="flex w-full sm:w-auto gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        toggleMutation.mutate(
                          { id: selectedAttraction.id, isActive: !selectedAttraction.isActive },
                          { onSuccess: () => setSelectedAttraction({ ...selectedAttraction, isActive: !selectedAttraction.isActive }) }
                        )
                      }}
                      disabled={toggleMutation.isPending}
                      className={selectedAttraction.isActive ? "flex-1 sm:flex-none text-destructive hover:bg-destructive/10 hover:text-destructive border-border" : "flex-1 sm:flex-none text-green-500 hover:bg-green-500/10 hover:text-green-500 border-border"}
                    >
                      {selectedAttraction.isActive ? <><PowerOff className="w-4 h-4 mr-2" /> Dezaktywuj</> : <><Power className="w-4 h-4 mr-2" /> Aktywuj</>}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" className="border-border text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Czy na pewno chcesz usunąć atrakcję?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Ta akcja jest nieodwracalna. Spowoduje trwałe usunięcie atrakcji "{selectedAttraction.name}" z bazy danych. Jeśli atrakcja ma historię wynajmu, lepszą opcją jest jej <b>dezaktywacja</b>.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Anuluj</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            onClick={(e) => {
                              e.preventDefault()
                              deleteMutation.mutate(selectedAttraction.id, {
                                onSuccess: () => {
                                  setSelectedAttraction(null)
                                }
                              })
                            }}
                          >
                            {deleteMutation.isPending ? "Usuwanie..." : "Usuń bezpowrotnie"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <Button
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => {
                      setAttractionToEdit(selectedAttraction)
                      setIsFormOpen(true)
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edytuj
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{attractionToEdit ? 'Edytuj atrakcję' : 'Dodaj nową atrakcję'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <AttractionForm 
              attractionToEdit={attractionToEdit} 
              onSuccess={() => {
                setIsFormOpen(false)
                if (attractionToEdit && selectedAttraction?.id === attractionToEdit.id) {
                  setSelectedAttraction(null)
                }
              }}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
