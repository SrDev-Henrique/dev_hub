import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";

const schema = z
  .object({
    name: z.string().optional(),
    current_password: z.string().optional(),
    new_password: z.string().optional(),
  })
  .refine((data) => !data.new_password || data.new_password.length >= 8, {
    message: "A nova senha deve ter pelo menos 8 caracteres",
    path: ["new_password"],
  })
  .refine((data) => !data.new_password || !!data.current_password, {
    message: "Informe a senha atual para definir uma nova senha",
    path: ["current_password"],
  });

type FormValues = z.infer<typeof schema>;

export function SettingsPage() {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? "" },
  });

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  async function onSubmit(values: FormValues) {
    const payload: Record<string, unknown> = {};
    if (values.name !== undefined && values.name !== user?.name) payload.name = values.name;
    if (values.new_password) {
      payload.new_password = values.new_password;
      payload.current_password = values.current_password;
    }
    if (photoFile) payload.photo = photoFile;

    if (Object.keys(payload).length === 0) return;

    await updateProfile.mutateAsync(payload);
    reset({ name: payload.name as string | undefined ?? values.name, current_password: "", new_password: "" });
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg p-4">
      <Card>
        <CardHeader>
          <CardTitle>Configurações do perfil</CardTitle>
          <CardDescription>
            Altere o que quiser — nome, foto e senha são todos independentes e opcionais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarImage src={photoPreview ?? user.profile_photo_url} alt={user.username} />
                <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <Label htmlFor="photo">Foto de perfil</Label>
                <Input id="photo" type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoChange} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...register("name")} />
            </div>

            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <p className="text-sm font-medium">Alterar senha</p>
              <Label htmlFor="current_password">Senha atual</Label>
              <Input id="current_password" type="password" {...register("current_password")} />
              {errors.current_password && (
                <p className="text-sm text-destructive">{errors.current_password.message}</p>
              )}
              <Label htmlFor="new_password">Nova senha</Label>
              <Input id="new_password" type="password" {...register("new_password")} />
              {errors.new_password && <p className="text-sm text-destructive">{errors.new_password.message}</p>}
            </div>

            <Button type="submit" disabled={isSubmitting || updateProfile.isPending}>
              Salvar alterações
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
