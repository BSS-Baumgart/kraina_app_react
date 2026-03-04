'use client'

import { useEffect, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import * as z from 'zod'
import { Attraction } from '@/lib/types'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useCreateAttraction, useUpdateAttraction } from '@/hooks/useAttractions'
import { supabase } from '@/lib/supabase'
import { X, UploadCloud, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

// Schemat walidacji Zod
const formSchema = z.object({
  name: z.string().min(2, 'Nazwa musi mieć co najmniej 2 znaki').max(100, 'Nazwa jest za długa'),
  description: z.string().min(5, 'Opis musi mieć co najmniej 5 znaków').max(1000, 'Opis jest za długi'),
  width: z.coerce.number().min(0.1, 'Szerokość musi być większa niż 0'),
  length: z.coerce.number().min(0.1, 'Długość musi być większa niż 0'),
  height: z.coerce.number().min(0.1, 'Wysokość musi być większa niż 0'),
  weight: z.coerce.number().min(1, 'Waga musi być większa niż 0'),
  rentalPrice: z.coerce.number().min(1, 'Cena musi być większa niż 0'),
  category: z.string().min(1, 'Kategoria jest wymagana'),
  isActive: z.boolean().default(true),
})

type FormValues = z.infer<typeof formSchema>

interface AttractionFormProps {
  attractionToEdit?: Attraction | null
  onSuccess?: () => void
  onCancel?: () => void
}

const CATEGORIES = [
  "Zamki dmuchane",
  "Zjeżdżalnie",
  "Place zabaw",
  "Tory przeszkód",
  "Inne"
]

// Bezpieczny resolver omijający błędy z rzucaniem ZodError w starszych/skonfliktowanych wersjach pakietów
const customZodResolver = (schema: z.ZodSchema): Resolver<FormValues> => async (values) => {
  const result = await schema.safeParseAsync(values)
  if (result.success) {
    return { values: result.data, errors: {} }
  }
  const errors: Record<string, any> = {}
  result.error.issues.forEach((issue) => {
    const path = issue.path[0] as string
    if (path && !errors[path]) {
      errors[path] = { type: issue.code as any, message: issue.message }
    }
  })
  return { values: {} as any, errors }
}

export function AttractionForm({ attractionToEdit, onSuccess, onCancel }: AttractionFormProps) {
  const createMutation = useCreateAttraction()
  const updateMutation = useUpdateAttraction()

  const isEditing = !!attractionToEdit

  const [existingImages, setExistingImages] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const form = useForm<FormValues>({
    resolver: customZodResolver(formSchema),
    defaultValues: attractionToEdit ? {
      name: attractionToEdit.name || '',
      description: attractionToEdit.description || '',
      width: attractionToEdit.width || 0,
      length: attractionToEdit.length || 0,
      height: attractionToEdit.height || 0,
      weight: attractionToEdit.weight || 0,
      rentalPrice: attractionToEdit.rentalPrice || 0,
      category: attractionToEdit.category || '',
      isActive: attractionToEdit.isActive ?? true,
    } : {
      name: '',
      description: '',
      width: 0,
      length: 0,
      height: 0,
      weight: 0,
      rentalPrice: 0,
      category: '',
      isActive: true,
    },
  })

  // Inicjalizacja formularza danymi z wybranej atrakcji (dla pewności, gdyby komponent nie był odmontowywany)
  useEffect(() => {
    if (attractionToEdit) {
      form.reset({
        name: attractionToEdit.name || '',
        description: attractionToEdit.description || '',
        width: attractionToEdit.width || 0,
        length: attractionToEdit.length || 0,
        height: attractionToEdit.height || 0,
        weight: attractionToEdit.weight || 0,
        rentalPrice: attractionToEdit.rentalPrice || 0,
        category: attractionToEdit.category || '',
        isActive: attractionToEdit.isActive ?? true,
      })
      setExistingImages(attractionToEdit.imageUrls || [])
    } else {
      setExistingImages([])
    }
  }, [attractionToEdit, form])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      
      const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4 MB
      const oversizedFiles = filesArray.filter(file => file.size > MAX_FILE_SIZE)
      
      if (oversizedFiles.length > 0) {
        toast.error('Rozmiar pojedynczego pliku nie może przekraczać 4 MB.')
        return
      }

      const totalImages = existingImages.length + selectedFiles.length + filesArray.length
      if (totalImages > 4) {
        toast.error('Można dodać maksymalnie 4 zdjęcia.')
        return
      }
      setSelectedFiles((prev) => [...prev, ...filesArray])
    }
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async (attractionId: string): Promise<string[]> => {
    const urls: string[] = []
    
    for (const file of selectedFiles) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `${attractionId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('attractions')
        .upload(filePath, file, { contentType: file.type })

      if (uploadError) {
        console.error('Błąd uploadu:', uploadError)
        throw new Error('Nie udało się wgrać zdjęcia')
      }

      const { data } = supabase.storage.from('attractions').getPublicUrl(filePath)
      urls.push(data.publicUrl)
    }

    return urls
  }

  const onSubmit = async (values: FormValues) => {
    setIsUploading(true)
    
    try {
      const attractionId = isEditing && attractionToEdit ? attractionToEdit.id : uuidv4()
      let newImageUrls: string[] = []

      if (selectedFiles.length > 0) {
        newImageUrls = await uploadImages(attractionId)
      }
      
      const finalImageUrls = [...existingImages, ...newImageUrls]

      const payload = {
        name: values.name,
        description: values.description,
        width: values.width,
        length: values.length,
        height: values.height,
        weight: values.weight,
        rentalPrice: values.rentalPrice,
        category: values.category || undefined,
        isActive: values.isActive,
        imageUrls: finalImageUrls,
      }

      if (isEditing && attractionToEdit) {
        updateMutation.mutate(
          { id: attractionToEdit.id, updates: payload },
          { onSuccess: () => onSuccess?.() }
        )
      } else {
        createMutation.mutate(
          { ...payload, id: attractionId } as any,
          { onSuccess: () => onSuccess?.() }
        )
      }
    } catch (error) {
      toast.error('Wystąpił błąd podczas zapisywania atrakcji lub wgrywania zdjęć.')
    } finally {
      setIsUploading(false)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending || isUploading
  const hasErrors = Object.keys(form.formState.errors).length > 0

  const onError = (errors: any) => {
    // Collect all error messages and show them as toasts
    const errorMessages = Object.values(errors).map((err: any) => err?.message).filter(Boolean)
    
    if (errorMessages.length > 0) {
      errorMessages.forEach(msg => toast.error(msg))
    } else {
      toast.error('Formularz zawiera błędy w walidacji. Sprawdź dokładnie wszystkie pola.')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Błąd walidacji</AlertTitle>
            <AlertDescription>
              Formularz zawiera niepoprawne dane. Sprawdź komunikaty wyświetlone pod polami na czerwono.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nazwa atrakcji</FormLabel>
                <FormControl>
                  <Input placeholder="np. Plac Straż pożarna" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategoria</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz kategorię..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                    {/* Fallback dla wartości spoza standardowej listy */}
                    {field.value && !CATEGORIES.includes(field.value) && (
                      <SelectItem value={field.value}>{field.value}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="width"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Szerokość (m)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="length"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Długość (m)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wysokość (m)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Waga (kg)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rentalPrice"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Cena wynajmu na 1 dzień (PLN)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Opis dla klienta</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Opisz specyfikę atrakcji..."
                    className="resize-y min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Upload zdjęć */}
          <div className="md:col-span-2 space-y-4 pt-2">
            <div>
              <FormLabel>Zdjęcia (Max 4 zdjęcia)</FormLabel>
              <FormDescription>
                Wgraj zdjęcia dla atrakcji (np. jpg, png). Pierwsze zdjęcie będzie główne. Upload nastąpi po zapisaniu formularza z zachowaniem struktury {`{attractionId}/{uuid}.jpg`}.
              </FormDescription>
            </div>
            
            <div className="flex flex-wrap gap-4">
              {/* Istniejące zdjęcia */}
              {existingImages.map((url, index) => (
                <div key={`existing-${index}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border group bg-muted flex-shrink-0">
                  <img src={url} alt={`Existing ${index}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="absolute top-1 right-1 bg-black/50 hover:bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Nowe pliki - podgląd */}
              {selectedFiles.map((file, index) => (
                <div key={`new-${index}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border group bg-muted flex-shrink-0">
                  <img src={URL.createObjectURL(file)} alt={`New ${index}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeSelectedFile(index)}
                    className="absolute top-1 right-1 bg-black/50 hover:bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Przycisk uploadu */}
              {existingImages.length + selectedFiles.length < 4 && (
                <label className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 cursor-pointer flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                  <UploadCloud className="w-6 h-6 mb-1" />
                  <span className="text-[10px] uppercase font-semibold">Wgraj</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          </div>

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 md:col-span-2">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Aktywna</FormLabel>
                  <FormDescription>
                    Czy wyświetlać tę atrakcję w kalkulatorze wynajmu.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-border">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
              Anuluj
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isUploading ? "Wgrywanie zdjęć..." : isPending ? "Zapisywanie..." : (isEditing ? "Zapisz zmiany" : "Dodaj atrakcję")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
