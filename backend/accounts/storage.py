import uuid

from django.conf import settings
from supabase import create_client


class SupabaseNotConfiguredError(Exception):
    pass


def upload_profile_photo(user_id, file_obj, content_type):
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        raise SupabaseNotConfiguredError("Supabase Storage não está configurado (SUPABASE_URL/SUPABASE_SERVICE_KEY).")

    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    extension = (file_obj.name.rsplit(".", 1)[-1] if "." in file_obj.name else "jpg").lower()
    path = f"{user_id}/{uuid.uuid4().hex}.{extension}"

    client.storage.from_(settings.SUPABASE_BUCKET).upload(
        path,
        file_obj.read(),
        {"content-type": content_type or "application/octet-stream"},
    )
    return client.storage.from_(settings.SUPABASE_BUCKET).get_public_url(path)
