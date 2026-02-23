"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Copy, 
  Trash2, 
  RefreshCw, 
  Plus, 
  Check, 
  Loader2, 
  AlertTriangle,
  Key,
  Edit,
  Download,
  Calendar
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BotStatsDashboard from "@/components/bot/BotStatsDashboard";

interface ApiKeyInfo {
  id: string;
  name: string;
  description: string | null;
  rateLimit: number;
  isActive: boolean;
  createdAt: string; 
  lastUsedAt: string | null;
  expiresAt: string | null;
  requestCount: number;
}

export default function BotApiKeysPage() {
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "revoked">("all");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<{
    name: string;
    description: string;
    rateLimit: number;
    expiresAt: string;
  }>({ name: "", description: "", rateLimit: 60, expiresAt: "" });
  const [isCreating, setIsCreating] = useState(false);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
    id: string;
    name: string;
    description: string;
    rateLimit: number;
    isActive: boolean;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // New Key Display Modal State (for Create & Rotate)
  const [newKey, setNewKey] = useState<string | null>(null);
  const [isNewKeyOpen, setIsNewKeyOpen] = useState(false);

  // Revoke Modal State
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Rotate Modal State
  const [rotateId, setRotateId] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);

  // Fetch Keys
  const fetchKeys = async () => {
    try {
      const response = await fetch("/api/bot/keys");
      const data = await response.json();
      
      if (data.success) {
        setKeys(data.data);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error?.message || "Error al cargar las claves API",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al cargar las claves API",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  // Handle Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      const payload: any = { ...createForm };
      if (!payload.expiresAt) delete payload.expiresAt;

      const response = await fetch("/api/bot/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsCreateOpen(false);
        setNewKey(data.data.apiKey);
        setIsNewKeyOpen(true);
        setCreateForm({ name: "", description: "", rateLimit: 60, expiresAt: "" });
        fetchKeys();
        toast({
          title: "Éxito",
          description: "Clave API creada correctamente",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error?.message || "Error al crear la clave API",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al crear la clave API",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Handle Edit (Open Modal)
  const openEditModal = (key: ApiKeyInfo) => {
    setEditForm({
      id: key.id,
      name: key.name,
      description: key.description || "",
      rateLimit: key.rateLimit,
      isActive: key.isActive,
    });
    setIsEditOpen(true);
  };

  // Handle Update
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    setIsEditing(true);

    try {
      const response = await fetch(`/api/bot/keys/${editForm.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          rateLimit: editForm.rateLimit,
          isActive: editForm.isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsEditOpen(false);
        setEditForm(null);
        fetchKeys();
        toast({
          title: "Éxito",
          description: "Clave API actualizada correctamente",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error?.message || "Error al actualizar la clave API",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al actualizar la clave API",
      });
    } finally {
      setIsEditing(false);
    }
  };

  // Handle Revoke
  const handleRevoke = async () => {
    if (!revokeId) return;
    setIsRevoking(true);
    
    try {
      const response = await fetch(`/api/bot/keys/${revokeId}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRevokeId(null);
        fetchKeys();
        toast({
          title: "Éxito",
          description: "Clave API revocada correctamente",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error?.message || "Error al revocar la clave API",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al revocar la clave API",
      });
    } finally {
      setIsRevoking(false);
    }
  };

  // Handle Rotate
  const handleRotate = async () => {
    if (!rotateId) return;
    setIsRotating(true);
    
    try {
      const response = await fetch(`/api/bot/keys/${rotateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rotate" }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRotateId(null);
        setNewKey(data.data.apiKey);
        setIsNewKeyOpen(true);
        fetchKeys();
        toast({
          title: "Éxito",
          description: "Clave API rotada correctamente",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error?.message || "Error al rotar la clave API",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al rotar la clave API",
      });
    } finally {
      setIsRotating(false);
    }
  };

  const copyToClipboard = (text: string, description: string = "Copiado al portapapeles") => {
    navigator.clipboard.writeText(text);
    toast({
      description,
      duration: 2000,
    });
  };

  const exportToCSV = () => {
    const headers = ["ID", "Name", "Description", "Rate Limit", "Status", "Created At", "Last Used At", "Expires At", "Request Count"];
    const rows = keys.map(key => [
      key.id,
      key.name,
      `"${key.description || ""}"`, // Escape quotes
      key.rateLimit,
      key.isActive ? "Active" : "Revoked",
      key.createdAt,
      key.lastUsedAt || "",
      key.expiresAt || "",
      key.requestCount
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bot_api_keys_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and Sort Logic
  const filteredKeys = keys
    .filter((key) => {
      const matchesSearch = key.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (key.description?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      
      let matchesStatus = true;
      if (statusFilter === "active") {
        matchesStatus = key.isActive;
      } else if (statusFilter === "revoked") {
        matchesStatus = !key.isActive;
      }
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="container mx-auto py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bot API Keys</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las claves de acceso para los bots de WhatsApp y Telegram.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nueva API Key
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="list">Listado</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value: "all" | "active" | "revoked") => setStatusFilter(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="revoked">Revocados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre / Descripción</TableHead>
              <TableHead>Límite</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Creada / Expira</TableHead>
              <TableHead>Último Uso</TableHead>
              <TableHead>Reqs (24h)</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Cargando...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : keys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No hay claves API creadas.
                </TableCell>
              </TableRow>
            ) : filteredKeys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No se encontraron claves API con los filtros actuales.
                </TableCell>
              </TableRow>
            ) : (
              filteredKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="max-w-[200px]">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 font-medium">
                        <Key className="h-3 w-3 text-muted-foreground" />
                        {key.name}
                      </div>
                      {key.description && (
                        <span className="text-xs text-muted-foreground truncate" title={key.description}>
                          {key.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{key.rateLimit}/min</TableCell>
                  <TableCell>
                    {key.isActive ? (
                      <Badge className="bg-green-600 hover:bg-green-700">Activa</Badge>
                    ) : (
                      <Badge variant="destructive">Revocada</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex flex-col">
                      <span>{format(new Date(key.createdAt), "dd MMM yyyy", { locale: es })}</span>
                      {key.expiresAt && (
                         <span className="text-xs text-amber-600 flex items-center gap-1">
                           <Calendar className="h-3 w-3" />
                           Exp: {format(new Date(key.expiresAt), "dd MMM yyyy", { locale: es })}
                         </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {key.lastUsedAt 
                      ? format(new Date(key.lastUsedAt), "dd MMM HH:mm", { locale: es })
                      : "Nunca"}
                  </TableCell>
                  <TableCell>{key.requestCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(key.id, "ID copiado al portapapeles")}
                        title="Copiar ID"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(key)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      {key.isActive && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setRotateId(key.id)}
                            title="Rotar clave"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setRevokeId(key.id)}
                            title="Revocar clave"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      </TabsContent>

      <TabsContent value="stats">
        <BotStatsDashboard />
      </TabsContent>
      </Tabs>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear Nueva API Key</DialogTitle>
            <DialogDescription>
              Genera una nueva clave de acceso. Se mostrará solo una vez.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="create-name">Nombre <span className="text-destructive">*</span></Label>
                <Input
                  id="create-name"
                  placeholder="Ej: Bot WhatsApp Producción"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                  maxLength={100}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-description">Descripción</Label>
                <Textarea
                  id="create-description"
                  placeholder="Descripción del uso de esta clave..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  maxLength={200}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="create-rateLimit">Límite (req/min)</Label>
                  <Input
                    id="create-rateLimit"
                    type="number"
                    min="1"
                    max="10000"
                    value={createForm.rateLimit}
                    onChange={(e) => setCreateForm({ ...createForm, rateLimit: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-expiresAt">Expira (Opcional)</Label>
                  <Input
                    id="create-expiresAt"
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={createForm.expiresAt}
                    onChange={(e) => setCreateForm({ ...createForm, expiresAt: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear API Key
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar API Key</DialogTitle>
            <DialogDescription>
              Modifica los metadatos de la clave. No puedes ver ni cambiar el secreto.
            </DialogDescription>
          </DialogHeader>
          {editForm && (
            <form onSubmit={handleUpdate}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Nombre</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                    maxLength={100}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Descripción</Label>
                  <Textarea
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    maxLength={200}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-rateLimit">Límite (req/min)</Label>
                  <Input
                    id="edit-rateLimit"
                    type="number"
                    min="1"
                    max="10000"
                    value={editForm.rateLimit}
                    onChange={(e) => setEditForm({ ...editForm, rateLimit: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                   <Label htmlFor="edit-status">Estado:</Label>
                   <Badge variant={editForm.isActive ? "default" : "destructive"}>
                     {editForm.isActive ? "Activa" : "Revocada"}
                   </Badge>
                   {!editForm.isActive && (
                     <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditForm({ ...editForm, isActive: true })}
                     >
                       Reactivar
                     </Button>
                   )}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isEditing}>
                  {isEditing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* New Key Display Modal */}
      <Dialog open={isNewKeyOpen} onOpenChange={setIsNewKeyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              API Key Generada Exitosamente
            </DialogTitle>
            <DialogDescription>
              Copia y guarda esta clave ahora. <span className="font-bold text-destructive">No podrás verla nuevamente.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 bg-muted p-4 rounded-md">
            <code className="flex-1 font-mono text-sm break-all">
              {newKey}
            </code>
            <Button
              size="sm"
              className="px-3"
              onClick={() => newKey && copyToClipboard(newKey, "API Key copiada al portapapeles")}
            >
              <span className="sr-only">Copiar</span>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => setIsNewKeyOpen(false)}
            >
              Entendido, ya la he guardado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Modal */}
      <Dialog open={!!revokeId} onOpenChange={(open) => !open && setRevokeId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Revocar API Key
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro que deseas revocar esta clave? Cualquier bot que la esté utilizando dejará de funcionar inmediatamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeId(null)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRevoke}
              disabled={isRevoking}
            >
              {isRevoking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sí, revocar clave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rotate Confirmation Modal */}
      <Dialog open={!!rotateId} onOpenChange={(open) => !open && setRotateId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Rotar API Key
            </DialogTitle>
            <DialogDescription>
              Esto generará una nueva clave secreta para este registro y revocará la anterior inmediatamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRotateId(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleRotate}
              disabled={isRotating}
            >
              {isRotating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sí, rotar clave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
