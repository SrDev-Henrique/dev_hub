import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Me } from "@/lib/types";

export interface UpdateProfileInput {
  name?: string;
  current_password?: string;
  new_password?: string;
  photo?: File;
}

export function useUpdateProfile() {
  const { updateUser } = useAuth();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const formData = new FormData();
      if (input.name !== undefined) formData.append("name", input.name);
      if (input.current_password) formData.append("current_password", input.current_password);
      if (input.new_password) formData.append("new_password", input.new_password);
      if (input.photo) formData.append("photo", input.photo);

      const { data } = await api.patch<Me>("/auth/me/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: (data) => {
      updateUser(data);
      toast.success("Perfil atualizado!");
    },
    onError: () => toast.error("Não foi possível atualizar o perfil. Confira os dados e tente novamente."),
  });
}
