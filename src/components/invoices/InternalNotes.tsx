'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { fetchInvoiceNotes, createInvoiceNote, InvoiceNote } from '@/lib/api/invoice-notes';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/utils';

interface InternalNotesProps {
  invoiceId: string;
}

export function InternalNotes({ invoiceId }: InternalNotesProps) {
  const [notes, setNotes] = useState<InvoiceNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;

    const loadNotes = async () => {
      setLoading(true);
      try {
        const data = await fetchInvoiceNotes(invoiceId);
        if (!cancelled) {
          setNotes(data);
        }
      } catch (error) {
        if (!cancelled) {
          toast({
            title: 'Error al cargar notas',
            description: 'No se pudieron cargar las notas internas de la factura.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadNotes();

    return () => {
      cancelled = true;
    };
  }, [invoiceId, toast]);

  const handleAddNote = async () => {
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const note = await createInvoiceNote(invoiceId, content.trim());
      setNotes((prev) => [...prev, note]);
      setContent('');
      toast({
        title: 'Nota agregada',
        description: 'La nota interna se guardó correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error al guardar nota',
        description: 'No se pudo guardar la nota interna.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notas internas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Agregar una nota interna (solo visible para el equipo interno)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={submitting}
          />
          <div className="flex justify-end">
            <Button onClick={handleAddNote} disabled={submitting || !content.trim()} size="sm">
              {submitting ? 'Guardando...' : 'Agregar nota'}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando notas...</p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay notas internas.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="rounded-md border p-3 text-sm space-y-1">
                <p>{note.content}</p>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>
                    {note.user.firstName || note.user.lastName
                      ? `${note.user.firstName ?? ''} ${note.user.lastName ?? ''}`.trim()
                      : 'Usuario interno'}
                  </span>
                  <span>{formatDate(note.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

