from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "name", "profile_photo_url"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ["id", "username", "email", "name", "password"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "name", "profile_photo_url"]
        read_only_fields = ["id", "username", "email"]


class UpdateProfileSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    current_password = serializers.CharField(required=False, write_only=True)
    new_password = serializers.CharField(required=False, write_only=True, validators=[validate_password])
    photo = serializers.ImageField(required=False)

    def validate(self, attrs):
        if "new_password" in attrs and not attrs.get("current_password"):
            raise serializers.ValidationError({"current_password": "Informe a senha atual para definir uma nova senha."})
        return attrs

    def update(self, instance, validated_data):
        if "name" in validated_data:
            instance.name = validated_data["name"]

        if "new_password" in validated_data:
            if not instance.check_password(validated_data["current_password"]):
                raise serializers.ValidationError({"current_password": "Senha atual incorreta."})
            instance.set_password(validated_data["new_password"])

        photo = validated_data.get("photo")
        if photo is not None:
            from .storage import upload_profile_photo

            instance.profile_photo_url = upload_profile_photo(instance.id, photo, photo.content_type)

        instance.save()
        return instance
